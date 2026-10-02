/**
 * tiktok-player.js - TikTok-Style Promo Video Player for Ghana Cash
 * Implements full-screen overlay, vertical scrolling (4 slides), 
 * double-tap to like, floating action buttons (like, comment, favorite, share),
 * and dynamic comment section with simulated 5k comments.
 */

(function() {
  // Styles for the TikTok player
  const css = `
    /* Preloader screen styles */
    .tt-preloader-overlay {
      position: absolute;
      inset: 0;
      background: #000;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease;
    }
    .tt-preloader-overlay.fade-out {
      opacity: 0;
      pointer-events: none;
    }
    .tt-preloader-circle-wrap {
      position: relative;
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }
    .tt-preloader-circle {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 4px solid #1e293b;
      border-top-color: #06b6d4;
      animation: tt-spin 1.5s linear infinite;
    }
    .tt-preloader-play-icon {
      font-size: 24px;
      color: #06b6d4;
      z-index: 10;
      animation: tt-pulse 2s infinite ease-in-out;
    }
    .tt-preloader-title {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 8px;
      color: #f8fafc;
      letter-spacing: -0.5px;
    }
    .tt-preloader-subtitle {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 32px;
      font-weight: 500;
    }
    .tt-preloader-bar-wrap {
      width: 200px;
      height: 4px;
      background: #1e293b;
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    }
    .tt-preloader-bar-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #06b6d4, #3b82f6);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
    @keyframes tt-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes tt-pulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.15); opacity: 1; }
    }

    .tt-overlay {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #fff;
      overflow: hidden;
      user-select: none;
    }
    .tt-header {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .tt-back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.3s;
    }
    .tt-back-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .tt-container {
      flex: 1;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }
    .tt-container::-webkit-scrollbar {
      display: none;
    }
    .tt-slide {
      width: 100%;
      height: 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      position: relative;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tt-video-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tt-video-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.35;
      filter: blur(20px);
      z-index: 1;
    }
    .tt-video {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: transparent;
    }
    .tt-play-icon {
      position: absolute;
      z-index: 10;
      font-size: 64px;
      color: rgba(255, 255, 255, 0.7);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
      transform: scale(1.5);
    }
    .tt-play-icon.show {
      opacity: 1;
      transform: scale(1);
    }
    /* Floating Sidebar */
    .tt-sidebar {
      position: absolute;
      right: 12px;
      bottom: 120px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
    }
    .tt-sidebar-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      outline: none;
    }
    .tt-sidebar-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      transition: transform 0.2s, background-color 0.2s;
      color: #fff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
    .tt-sidebar-btn:active .tt-sidebar-icon {
      transform: scale(0.9);
    }
    .tt-sidebar-btn.liked .tt-sidebar-icon {
      color: #ff3b30;
      background-color: rgba(255, 59, 48, 0.1);
      border-color: rgba(255, 59, 48, 0.3);
    }
    .tt-sidebar-btn.favorited .tt-sidebar-icon {
      color: #ffcc00;
      background-color: rgba(255, 204, 0, 0.1);
      border-color: rgba(255, 204, 0, 0.3);
    }
    .tt-sidebar-label {
      font-size: 11px;
      font-weight: 700;
      color: #f1f5f9;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }
    /* Video Info Overlay */
    .tt-info {
      position: absolute;
      left: 16px;
      bottom: 24px;
      right: 80px;
      z-index: 20;
      text-align: left;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }
    .tt-username {
      font-size: 15px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tt-username span {
      background: #00bfb2;
      color: #fff;
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 900;
    }
    .tt-desc {
      font-size: 13px;
      font-weight: 500;
      color: #e2e8f0;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    .tt-music {
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }
    .tt-music i {
      animation: rotateDisc 4s linear infinite;
    }
    @keyframes rotateDisc {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    /* Heart Popup Animation */
    .heart-popup {
      position: absolute;
      font-size: 80px;
      color: #ff3b30;
      pointer-events: none;
      z-index: 50;
      animation: flyHeart 0.8s ease-out forwards;
      text-shadow: 0 4px 15px rgba(255, 59, 48, 0.4);
    }
    @keyframes flyHeart {
      0% { transform: scale(0); opacity: 0; }
      15% { transform: scale(1.2); opacity: 0.9; }
      30% { transform: scale(1); opacity: 1; }
      100% { transform: translateY(-100px) rotate(15deg) scale(0.8); opacity: 0; }
    }
    /* Comment Modal (Slide Up) */
    .tt-comments-modal {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 70%;
      background: #111827;
      border-radius: 20px 20px 0 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 1000;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1);
      display: flex;
      flex-direction: column;
      box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
    }
    .tt-comments-modal.show {
      transform: translateY(0);
    }
    .tt-comments-header {
      padding: 18px;
      text-align: center;
      font-size: 13px;
      font-weight: 800;
      color: #94a3b8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
    }
    .tt-comments-close {
      position: absolute;
      right: 18px;
      top: 15px;
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 18px;
      cursor: pointer;
    }
    .tt-comments-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #111827;
    }
    .tt-comment-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      text-align: left;
    }
    .tt-comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .tt-comment-body {
      flex: 1;
    }
    .tt-comment-user {
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tt-comment-text {
      font-size: 13px;
      color: #f1f5f9;
      line-height: 1.4;
    }
    .tt-comment-time {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 500;
    }
    .tt-comments-input-wrap {
      padding: 12px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      background: #0f172a;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .tt-comments-input {
      flex: 1;
      padding: 12px 16px;
      border-radius: 50px;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.08);
      color: #fff;
      font-size: 13px;
      outline: none;
      font-family: inherit;
    }
    .tt-comments-send {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #6366f1;
      color: #fff;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // Pool of comments for dynamic generation
  const GHANAIAN_NAMES = [
    "kwame_gh", "akua_gh", "kofi_cash", "agbeko_investor", "mansa_wealth",
    "yaw_gmt", "afia_payout", "kwesi_earn", "yaa_gold", "osei_ecobank",
    "adjoa_cashout", "abena_gcb", "kobina_momo", "asante_key", "ama_gh",
    "mensah_invest", "efua_payout", "kojo_payout", "akwasi_rich", "baaba_cash",
    "fiifi_alert", "akosua_crypto", "kweku_payout", "sarpong_double", "boateng_cash",
    "serwaa_cedi", "owusu_verified", "martha_pay", "dankwa_momo", "esi_calbank",
    "gyasi_fidelity", "nathan_absa", "peace_telecel", "eugene_momo", "rita_cash"
  ];

  const GHANAIAN_COMMENTS = [
    // SET 1 — First Withdrawal / Small Payouts / Getting Started
    "Just withdrew 125 to my momo. First time and it entered sharp sharp",
    "My first withdrawal was 66.67. I was surprised it came so fast",
    "Started with free plan and got 41.67. Small but it works",
    "166.67 landed in my ecobank. This is my first time using ghana cash",
    "I was doubting but my first 100 entered my telecel. Its real",
    "First withdrawal of 208.33 done. Took like 2 minutes",
    "Got my alert for 83.33. Small money but im happy it works",
    "My first time and i got 150 in my gcb. No stress at all",
    "Just 58.33 but it entered instantly. ghana cash is legit",
    "Withdrew 250 first time. The process was smooth",
    "I started small with 41.67 payout. Now im upgrading my plan",
    "First withdrawal 183.33 to my fidelity. Very fast",
    "Got 116.67 in my absa bank. First time user and im impressed",
    "My initial payout was 91.67. Small but confirmed",
    "75 entered my calbank. First withdrawal no wahala",
    "I just collected 133.33. First time and everything worked fine",
    "Started with 50 payout. At least i know its not fake",
    "My first 291.67 landed. I was scared but it came through",
    "108.33 to my stanbic. First withdrawal and im satisfied",
    "Just got 158.33 now. First time using this platform",
    "Small 33.33 payout but it entered. Good for testing",
    "My first withdrawal was 233.33. Fast and easy",
    "141.67 entered my gcb bank. No issues at all",
    "I withdrew 75 as my first time. It worked perfectly",
    "First payout 175. Took less than 5 mins",
    "Got 216.67 in my telecel. My first withdrawal ever",
    "125 landed. I started with basic plan and it paid",
    "My first 266.67 entered. I can now trust this platform",
    "Just 83.33 but im happy. First withdrawal successful",
    "200 to my momo. First time and no stories",
    "I got 66.67 as first payout. Small beginnings",
    "My first withdrawal 166.67 entered my ecobank sharp",
    "91.67 payout. First time and it was instant",
    "Started with 116.67. Now i know ghana cash is real",
    "First time 225. The process is very simple",
    "I just got 41.67. Testing the waters and it works",
    "My first 191.67 landed in my gcb. Thank you",
    "150 first withdrawal. Very smooth experience",
    "I collected 100 first time. No verification wahala",
    "Just withdrew 241.67. First time and im shocked at the speed",
    "58.33 entered my absa bank. First payout done",
    "My initial withdrawal was 133.33. It came fast",
    "First time 258.33 to my fidelity. Everything good",
    "I got 83.33 as my first payout. Im going to upgrade now",
    "208.33 landed. First withdrawal and im very happy",
    "My first 158.33 entered instantly. No delay",
    "Started with 66.67 payout. Small but confirmed real",
    "First withdrawal 275. The site is easy to use",
    "I just got 50. First time and it entered my momo",
    "175 first payout. ghana cash is the real deal",

    // SET 2 — Verification / Linked Account / No Stress
    "After i verified my linked account i withdrew 416.67 instantly",
    "I verified my account with no stress and withdrew 333.33 asap",
    "Linked my bank and verified it. 625 entered immediately",
    "Verification was easy. Once done i withdrew 500 sharp",
    "I linked my momo and verified. My 458.33 came instantly",
    "No stress with verification. Withdrew 666.67 right after",
    "Verified my ecobank account and got 375 in 2 mins",
    "After linking and verifying i withdrew 750 no delay",
    "The verification took 1 minute. Then my 291.67 entered",
    "I verified my telecel and withdrew 541.67 immediately",
    "Linked account verified fast. My 583.33 payout came quick",
    "No wahala with verification. Withdrew 708.33 asap",
    "Verified my gcb and got 416.67 instantly",
    "After verification i withdrew 833.33 straight to my fidelity",
    "I linked my account and verified with no issues. 333.33 entered",
    "Verification done. Withdrew 791.67 and it landed sharp",
    "My account was verified in seconds. Then 250 came",
    "I verified my stanbic account and withdrew 458.33 no stress",
    "After linking my bank i verified and got 666.67 immediately",
    "Verification was smooth. Withdrew 375 right away",
    "I verified my calbank account. 500 entered my account fast",
    "No stress verification. Then i withdrew 625 asap",
    "Linked and verified my gcb bank. 416.67 came instantly",
    "After verification i withdrew 291.67 to my absa bank",
    "My account verification was quick. Then 750 entered",
    "I verified my linked account and got 541.67 in minutes",
    "Verification passed and i withdrew 708.33 immediately",
    "Linked my fidelity and verified. 333.33 landed sharp sharp",
    "No delay with verification. Withdrew 583.33 right after",
    "I verified my account and withdrew 458.33 with zero stress",
    "After linking i verified and got 833.33 instantly",
    "Verification was very easy. Then my 375 came through",
    "I verified my momo and withdrew 666.67 no stories",
    "My linked account was verified fast. 416.67 entered asap",
    "Verified my ecobank. Withdrew 791.67 immediately after",
    "No wahala at all. Verified and got 500 in my telecel",
    "I linked and verified my account. 625 came instantly",
    "After verification i withdrew 250 to my gcb",
    "Verification done in a flash. Then 708.33 landed",
    "I verified my absa bank and withdrew 541.67 sharp",
    "Linked account verified. Got 750 immediately no stress",
    "My verification was instant. Then i got 333.33 payout",
    "I verified my account and withdrew 458.33 asap. Very easy",
    "After verifying my stanbic i got 583.33 in less than 3 mins",
    "No stress verification process. Withdrew 666.67 right away",
    "I linked my bank verified it and got 416.67 instantly",
    "Verification passed and my 833.33 entered my fidelity fast",
    "Verified my calbank with no issues. Withdrew 375 asap",
    "After i verified my linked account i got 625 immediately",
    "I verified my account and withdrew 500. Smooth process",

    // SET 3 — Regular Users / Upgrading Plans / Medium Payouts
    "Just got 1666.67 in my momo. This is my third withdrawal",
    "My gold plan paid out 4166.67 today. Very happy",
    "Upgraded to basic and got 1250. Worth it",
    "2500 landed in my ecobank. Second withdrawal this month",
    "I now withdraw 2083.33 every two weeks. Consistent",
    "My payout was 3333.33 this time. Gold plan is working",
    "Got 1500 in my telecel. Regular user for 2 months now",
    "2916.67 entered my gcb. Third time using ghana cash",
    "I upgraded and got 5000. Best decision i made",
    "My 1833.33 payout came through. Very reliable",
    "3750 to my fidelity. I use this platform every month",
    "Got 2333.33 today. Second withdrawal and still smooth",
    "My basic plan gave me 1000. Not bad at all",
    "4166.67 landed in my absa bank. I am a regular now",
    "I withdrew 2666.67. This is my fourth time",
    "1666.67 entered my stanbic. Consistent payouts every time",
    "My gold plan just gave me 4583.33. I love this platform",
    "Got 1416.67 in my calbank. Using for 3 months straight",
    "3166.67 payout. I upgraded last month and it paid off",
    "I collect 2083.33 every month now. Very steady",
    "My 3500 entered my gcb bank. Regular customer here",
    "Got 2500 today. Second withdrawal this month alone",
    "1250 landed. I am on basic plan and its fine",
    "My payout was 4000. Gold plan doing wonders",
    "I withdrew 2166.67 to my momo. Third time no issues",
    "2833.33 entered my ecobank. I use ghana cash every two weeks",
    "Got 1583.33. Upgraded from free to basic last month",
    "My 4250 landed in my telecel. Very consistent platform",
    "I get 1833.33 every payout now. Very happy customer",
    "3333.33 to my fidelity. This is my fifth withdrawal",
    "Got 2333.33 in my gcb. Regular user for 4 months",
    "My payout was 3000. Gold plan is worth the upgrade",
    "I withdrew 1916.67. Second time this month",
    "3750 entered my absa bank. I trust this platform now",
    "Got 1416.67. Basic plan but it pays on time",
    "My 4166.67 payout came. Third month on gold plan",
    "I collect 2000 every month. Very reliable source",
    "2666.67 landed in my stanbic. Fourth withdrawal done",
    "Got 3250 today. I upgraded and im seeing the difference",
    "My 1750 entered calbank. Consistent every time",
    "I withdrew 3833.33. Regular user and no complaints",
    "2500 to my gcb bank. This is my sixth withdrawal",
    "Got 2083.33 in my momo. Using for 3 months now",
    "My payout was 3416.67. Gold plan is really good",
    "I get 1500 every two weeks. Basic plan doing fine",
    "2916.67 entered my ecobank. Very happy with ghana cash",
    "My 2250 landed. Fourth time using the platform",
    "Got 4083.33 today. Upgraded last month and no regrets",
    "I withdrew 1833.33 to my telecel. Regular customer",
    "My 2750 payout came through. Very solid platform",

    // SET 4 — Referrals / Community / Friends & Family
    "My brother referred me and i got my first 166.67. Thanks bro",
    "I referred 3 people and got bonus 833.33. ghana cash is sweet",
    "My friend told me about this. I just got 125 first time",
    "I told my sister and she also got her payout. Family money",
    "Referred my neighbour and got 416.67 bonus. Platform too good",
    "My cousin introduced me. First withdrawal 208.33 done",
    "I brought my friend and we both got paid. Win win",
    "My referral bonus was 666.67. Just for telling people",
    "My whole street is using ghana cash now. Everyone dey collect",
    "I referred my colleague and he got 250 first time",
    "My mama dey use am now. She got 100 first payout",
    "I told my ex about it and she got paid too. ghana cash for all",
    "My referral link don give me 1250 this month alone",
    "Brought my guy and he withdrew 333.33 instantly. We happy",
    "My sister referred me. I got 150 and im grateful",
    "I introduced 5 friends. All of them don collect money",
    "My referral bonus entered my account. 500 sharp",
    "My brother got 183.33 first time. I told you it works",
    "I shared my link on whatsapp and got 750 bonus. Mad",
    "My friend doubted until he saw my alert. Now he registered",
    "My cousin got 291.67 first withdrawal. Family eating good",
    "I referred my boss and he got 4166.67. He shock",
    "My neighbour dey thank me everyday for showing am ghana cash",
    "I put my link on my status and got 583.33 referral bonus",
    "My friend got 233.33 first time. He thought i was joking",
    "I told my church member and she got 133.33. God bless",
    "My referral money don pass 1666.67 this month. Just sharing link",
    "My guy got 375 first payout. We dey chop together",
    "I introduced my landlord and he got 833.33. He shock",
    "My sister got 166.67 first time. Now she upgraded her plan",
    "I shared with my group and 10 people joined. Bonus too much",
    "My friend got 458.33. He dey call me boss now",
    "I referred my classmate and he got 125. Students eating",
    "My link gave me 1000 this week. Just from telling people",
    "My brother got 316.67 first withdrawal. I no dey lie",
    "I told my barber and he got 208.33. Now he dey tell customers",
    "My referral bonus was 333.33. Small but it adds up",
    "My friend got 541.67. He thought it was fake until alert enter",
    "I introduced my aunt and she got 250. She dey happy",
    "My whatsapp status don turn to ghana cash advert. Bonus dey flow",
    "My guy got 400 first time. Now he dey refer people too",
    "I told my gym partner and he got 166.67. We both flexing",
    "My referral money entered 1500 this month. No be joke",
    "My friend got 275. He say i save his life",
    "I shared with my family group. 7 people don withdraw",
    "My neighbour got 225 first time. He dey thank me everyday",
    "I referred my old school mate and he got 350. Connected",
    "My link bonus don reach 2083.33. I just dey share for facebook",
    "My friend got 483.33 first payout. He dey shout for phone",
    "I told one stranger for bus and he got 158.33. ghana cash for everybody",

    // OTHER REVIEWS & TESTIMONIALS
    "Just got my alert now. 12500 to my telecel. ghana cash is real abeg",
    "I was scared at first but i tried with small money. Now im on gold plan and its paying. Thanks ghana cash",
    "Fast payout no cap. My ecobank got credited in 2 mins. Never seen this before",
    "Been using for 3 months now. Every withdrawal enters. No stories",
    "My friend introduced me last month. I have withdrawn 22500 already. This thing works fr",
    "Customer care replies fast. Had issue with my acc number and they fixed it in 5 mins",
    "I don upgrade to diamond. 33333.33 landed yesterday. I still cant believe it",
    "This is the only platform that has not disappointed me. Others i tried before scammed me",
    "Got my first 6666.67 last week. Used it to pay my school fees. God bless ghana cash",
    "The app is smooth. No crashing. No hanging. Just withdraw and money enters",
    "I started with basic plan because i didnt have much money. The first month i got 5000. I upgraded to gold immediately. Last month my payout was 15000. If you are still thinking about it just try it. It really works",
    "As a single mum i needed extra income. I saw ghana cash on facebook and decided to try. That was 4 months ago. I have made over 41666.67 total. I was able to start my small business with the money. Im so grateful",
    "I have used many online platforms before and lost money. ghana cash is different because you can see other people cashing out live. My first withdrawal of 10000 entered my GTB in less than 10 minutes. Now i tell everyone about it",
    "The verification was easy. I linked my gcb and my 29166.67 payout came through without any wahala. The dashboard is even better than some bank apps i use. These guys know what they are doing",
    "I referred my cousin and my neighbour. The referral bonus alone has given me 7500 this month. Im not even doing anything extra just telling people about it. ghana cash is too good",
    "I work as a teacher and salary is not enough. I put small money in ghana cash basic plan. Now i withdraw 4166.67 every month. It has helped me so much with my family expenses. Thank you to the team",
    "My first time i was shaking when i put money. But when i saw 6250 enter my stanbic account i knew it was real. That was 6 months ago. Now i withdraw 16666.67+ every month. My life has changed",
    "I like that there are no hidden charges. What they show is what you get. I withdrew 17500 and exactly 17500 entered my account. No deductions no stories. Very transparent platform",
    "I was about to borrow money from someone when i found ghana cash. I used the little i had and now i dont need to borrow anymore. I even lend people money now. Diamond plan is the best",
    "The mobile site works perfectly on my iphone. I dont even need to download any app. Just open and withdraw. My last payout was 10833.33 to my momo. Took 3 minutes. Amazing",
    "My name is Kwesi. I am a driver in accra. Life was very hard until someone told me about ghana cash. I started with 416.67 on basic plan. First month i got 2916.67. I upgraded to gold and last month i got 12500. I have bought my own car now and i dont drive for uber anymore. This platform changed my life. If you are reading this and you are doubting please just try it",
    "I am a student who just finished school. No job no money. I saw ghana cash on instagram and almost scrolled past because i have been scammed before. But i decided to try with free plan first. I saw how it works then i put small money. My first payout was 3333.33. I used it to learn a skill and also kept investing. 6 months later i have withdrawn over 33333.33. I am planning to open my own shop. Thank you ghana cash",
    "I am a widow with three children. Paying school fees was a problem. My neighbour showed me ghana cash and i started with the little i had. First payout of 4166.67 helped me pay one term fees. I kept working and referring people. Last term i paid full year fees and bought new uniforms for my children with my 13333.33 payout. This platform gave me hope when i had none. God bless the people running it",
    "I trade forex and i have blown many accounts. My friend told me instead of gambling with forex i should try ghana cash. I put 1666.67 on diamond plan. In 30 days 23333.33 entered my absa bank. I used 8333.33 to trade properly and the rest i used for my family. Now i have both forex income and ghana cash income. Double money. The platform is solid",
    "I run a small shop in the market. I needed money to buy more goods. I tried ghana cash gold plan and got 12500 in my first month. I bought goods sold them and still got my payout every two weeks. Now my shop is bigger and i still get money from ghana cash. It is like having two businesses",
    "I told my girlfriend about ghana cash she said its a scam. I showed her my 16666.67 alert. Now she wants me to teach her. Who is laughing now 😂",
    "My village people think i have joined something because money keeps entering my account. I told them its ghana cash. Now half the village has registered",
    "I withdrew 12500 at 2am because i couldnt sleep. Money entered my momo in 3 minutes. I shouted in the midnight and my mother almost fainted. ghana cash does not sleep",
    "My ex that left me because i was broke is now in my dm since i posted my 25000 payout. ghana cash you are too much",
    "My pastor asked me what business i am doing. I said i am serving the god of ghana cash. He wants the link too 😂",
    "I have been using ghana cash for 8 months. Every payout has entered my account without fail. Total withdrawn so far is over 50000. Very reliable platform",
    "The platform is easy to use even for someone like me who is not good with technology. I am 52 years old and i can withdraw without any problem. My last payout was 7500",
    "I compared many platforms before choosing ghana cash. The transparency is what i like most. You can see the queue and live payouts. I withdrew 20833.33 last week and it was smooth",
    "As a business owner i need quick access to funds. ghana cash has helped me with cash flow. I have processed withdrawals totalling over 66666.67 with zero issues. Recommended",
    "I started small and grew gradually. That is what i advise everyone. Start with what you have and upgrade as you go. I am now on diamond and my payouts are consistent",
    "5 stars. Fast payout. 15000 entered my ecobank in 3 minutes. No stress",
    "Best support team. Always online and helpful. Plus the money comes fast",
    "Used for 8 months. Every single payout entered. No fail. Would give 10 stars if i could",
    "Clean dashboard. I can see everything clearly. Then the money enters like magic. Love it",
    "I told my friends and family about it. Even my mother uses it now and she has withdrawn 6666.67. If its good enough for my mother then its good",
    "Why stay broke when ghana cash is paying? Join now",
    "Your account can have 8333.33 more by tomorrow. ghana cash is waiting",
    "Not magic. Not juju. Just ghana cash working. 16666.67 payouts weekly",
    "The platform that turns small money into big money. ghana cash",
    "Stop watching others withdraw. Start your own journey today"
  ];

  let shuffledComments = [];
  let commentPointer = 0;
  function getNextComment() {
    if (shuffledComments.length === 0 || commentPointer >= shuffledComments.length) {
      shuffledComments = [...GHANAIAN_COMMENTS];
      for (let i = shuffledComments.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffledComments[i];
        shuffledComments[i] = shuffledComments[j];
        shuffledComments[j] = temp;
      }
      commentPointer = 0;
    }
    const c = shuffledComments[commentPointer];
    commentPointer++;
    return c;
  }

  let shuffledNames = [];
  let namePointer = 0;
  function getNextUsername() {
    if (shuffledNames.length === 0 || namePointer >= shuffledNames.length) {
      shuffledNames = [...GHANAIAN_NAMES];
      for (let i = shuffledNames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = shuffledNames[i];
        shuffledNames[i] = shuffledNames[j];
        shuffledNames[j] = temp;
      }
      namePointer = 0;
    }
    const n = shuffledNames[namePointer];
    namePointer++;
    return '@' + n;
  }

  // Helper to format counts in 'k' notation
  function formatCount(num) {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num;
  }

  function optimizeCloudinaryVideoUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (!url.includes('cloudinary.com')) return url;
    let clean = url.trim();
    clean = clean.replace(/\.(mov|MOV|avi|AVI|mkv|MKV|webm|WEBM|flv|FLV|wmv|WMV)$/, '.mp4');
    if (clean.includes('/f_auto') || clean.includes('/f_mp4') || clean.includes('/vc_h264')) {
      return clean;
    }
    clean = clean.replace(/\/video\/upload\/(v\d+\/)/, '/video/upload/f_mp4,vc_h264,q_auto/$1');
    clean = clean.replace(/\/video\/upload\/(?!f_mp4|f_auto|vc_h264)/, '/video/upload/f_mp4,vc_h264,q_auto/');
    return clean;
  }

  // Double tap handler
  let lastTap = 0;
  function handleVideoDoubleTap(e, slideId, buttonEl, countEl) {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Trigger like
      triggerLikeEffect(e);
      if (!buttonEl.classList.contains('liked')) {
        likeVideo(slideId, buttonEl, countEl);
      }
    }
    lastTap = now;
  }

  // Trigger floating heart on double click
  function triggerLikeEffect(e) {
    const wrapper = e.currentTarget;
    const rect = wrapper.getBoundingClientRect();
    // Get absolute coordinates from touch/click event
    let x = rect.width / 2;
    let y = rect.height / 2;
    if (e.clientX && e.clientY) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else if (e.touches && e.touches[0]) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    }

    const heart = document.createElement('i');
    heart.className = 'fa-solid fa-heart heart-popup';
    heart.style.left = `${x - 40}px`;
    heart.style.top = `${y - 40}px`;
    wrapper.appendChild(heart);

    setTimeout(() => heart.remove(), 800);
  }

  // Like video function
  function likeVideo(slideId, buttonEl, countEl) {
    buttonEl.classList.add('liked');
    const heartIcon = buttonEl.querySelector('i');
    heartIcon.className = 'fa-solid fa-heart';
    
    // Fetch and increment in backend SQL
    const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000' : '';
    fetch(`${API_URL}/api/login-video/${slideId}/like`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          countEl.textContent = formatCount(data.likes);
        } else {
          // Fallback local increment
          let curr = parseInt(countEl.dataset.value) || 0;
          curr++;
          countEl.textContent = formatCount(curr);
        }
      })
      .catch(() => {
        let curr = parseInt(countEl.dataset.value) || 0;
        curr++;
        countEl.textContent = formatCount(curr);
      });
  }

  // Generate dynamic list of comments (simulating 5k comments)
  function renderComments(container) {
    container.innerHTML = '';
    
    // Generate 35 highly realistic comments initially, with scroll loader
    for (let i = 0; i < 35; i++) {
      const item = createCommentElement(i);
      container.appendChild(item);
    }

    // Add scroll listener for infinite comment scroll to simulate 5,000 comments
    container.addEventListener('scroll', function() {
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 50) {
        // Load 15 more
        for (let i = 0; i < 15; i++) {
          const item = createCommentElement(container.children.length);
          container.appendChild(item);
        }
      }
    });
  }

  function createCommentElement(index, customText = null, customUser = null) {
    const user = customUser || getNextUsername();
    const comment = customText || getNextComment();
    
    // Hours/days ago
    let timeAgo = '';
    if (index === 0) timeAgo = 'Just now';
    else if (index < 5) timeAgo = `${index}m ago`;
    else if (index < 24) timeAgo = `${Math.floor(index / 2) + 1}h ago`;
    else timeAgo = `${Math.floor(index / 24) + 1}d ago`;

    const el = document.createElement('div');
    el.className = 'tt-comment-item';
    el.innerHTML = `
      <div class="tt-comment-avatar">
        ${user.replace('@','').substring(0, 2).toUpperCase()}
      </div>
      <div class="tt-comment-body">
        <div class="tt-comment-user">${user}</div>
        <div class="tt-comment-text">${comment}</div>
        <div class="tt-comment-time">${timeAgo}</div>
      </div>
    `;
    return el;
  }

  // Show TikTok Modal
  window.showTikTokModal = function(videos, startIndex = 0, onWatchedCallback) {
    if (!videos || videos.length === 0) {
      console.warn("No videos provided to TikTok player.");
      return;
    }

    // Create modal wrapper
    const overlay = document.createElement('div');
    overlay.className = 'tt-overlay';
    overlay.id = 'tiktokModalOverlay';

    // Create preloader overlay
    const preloader = document.createElement('div');
    preloader.className = 'tt-preloader-overlay';
    preloader.innerHTML = `
      <div class="tt-preloader-circle-wrap">
        <div class="tt-preloader-circle"></div>
        <i class="fa-solid fa-play tt-preloader-play-icon"></i>
      </div>
      <div class="tt-preloader-title">Preparing Videos</div>
      <div class="tt-preloader-subtitle" id="ttPreloaderSubtitle">Loading 0 of ${videos.length}...</div>
      <div class="tt-preloader-bar-wrap">
        <div class="tt-preloader-bar-fill" id="ttPreloaderBarFill"></div>
      </div>
    `;
    overlay.appendChild(preloader);

    let loadedCount = 0;
    const subtitleEl = preloader.querySelector('#ttPreloaderSubtitle');
    const barEl = preloader.querySelector('#ttPreloaderBarFill');
    let targetIndex = startIndex >= 0 && startIndex < videos.length ? startIndex : 0;
    let isDismissed = false;

    // Simulate progressive preloading bar fill over 1.2 seconds for visual loading system
    let currentLoaded = 0;
    let progressTimer = setInterval(() => {
      if (currentLoaded < videos.length) {
        currentLoaded++;
        const percent = Math.min(95, Math.round((currentLoaded / videos.length) * 100));
        if (barEl) barEl.style.width = percent + '%';
        if (subtitleEl) subtitleEl.textContent = `Loading ${currentLoaded} of ${videos.length}...`;
      }
    }, 250);

    function showMuteNotification() {
      // Create a temporary mute guide overlay
      const guide = document.createElement('div');
      guide.className = 'tt-mute-guide';
      guide.style.position = 'absolute';
      guide.style.top = '50%';
      guide.style.left = '50%';
      guide.style.transform = 'translate(-50%, -50%)';
      guide.style.background = 'rgba(0, 0, 0, 0.85)';
      guide.style.color = '#fff';
      guide.style.padding = '12px 22px';
      guide.style.borderRadius = '30px';
      guide.style.fontSize = '12px';
      guide.style.fontWeight = '800';
      guide.style.zIndex = '10000';
      guide.style.display = 'flex';
      guide.style.alignItems = 'center';
      guide.style.gap = '8px';
      guide.style.pointerEvents = 'none';
      guide.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
      guide.style.border = '1px solid rgba(255,255,255,0.1)';
      guide.style.transition = 'opacity 0.3s ease';
      guide.innerHTML = '<i class="fa-solid fa-volume-xmark" style="color:#06b6d4;"></i> Tap Screen to Unmute';
      
      const activeSlide = container.children[activeIndex];
      if (activeSlide) {
        const wrapper = activeSlide.querySelector('.tt-video-wrapper');
        if (wrapper) {
          wrapper.appendChild(guide);
          setTimeout(() => {
            guide.style.opacity = '0';
            setTimeout(() => guide.remove(), 300);
          }, 3000);
        }
      }
    }

    function dismissPreloader() {
      if (isDismissed) return;
      isDismissed = true;
      clearInterval(progressTimer);

      if (barEl) barEl.style.width = '100%';
      if (subtitleEl) subtitleEl.textContent = `Loading ${videos.length} of ${videos.length}...`;

      setTimeout(() => {
        preloader.classList.add('fade-out');
        setTimeout(() => {
          preloader.remove();
          // Play the active video with fallback play routines
          if (slideVideoElements[activeIndex]) {
            const activeVid = slideVideoElements[activeIndex].video;
            const activeBg = slideVideoElements[activeIndex].bg;

            const playPromise = activeVid.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Autoplay was blocked (needs muted policy on mobile)
                activeVid.muted = true;
                activeVid.play().catch(() => {});
                showMuteNotification();
              });
            }
            activeBg.play().catch(() => {});
            slideVideoElements[activeIndex].playIcon.classList.remove('show');
          }
        }, 500);
      }, 200);
    }

    // Dismiss preloader after 1.5 seconds max
    setTimeout(dismissPreloader, 1500);

    const loadedIndices = new Set();
    function markVideoLoaded(idx) {
      if (isDismissed) return;
      if (loadedIndices.has(idx)) return;
      loadedIndices.add(idx);
      
      if (idx === targetIndex) {
        dismissPreloader();
      }
    }

    // Header
    const header = document.createElement('div');
    header.className = 'tt-header';
    
    const backBtn = document.createElement('button');
    backBtn.className = 'tt-back-btn';
    backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
    backBtn.onclick = function() {
      // Pause all videos
      const activeVideos = overlay.querySelectorAll('video');
      activeVideos.forEach(v => v.pause());
      
      overlay.remove();
      if (onWatchedCallback) onWatchedCallback();
    };
    header.appendChild(backBtn);
    overlay.appendChild(header);

    // Scrollable Container
    const container = document.createElement('div');
    container.className = 'tt-container';
    overlay.appendChild(container);

    // Comments sliding overlay
    const commentsModal = document.createElement('div');
    commentsModal.className = 'tt-comments-modal';
    commentsModal.innerHTML = `
      <div class="tt-comments-header">
        Comments (5.0k)
        <button class="tt-comments-close">✕</button>
      </div>
      <div class="tt-comments-list"></div>
      <div class="tt-comments-input-wrap">
        <input type="text" class="tt-comments-input" placeholder="Add comment..." />
        <button class="tt-comments-send"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    `;
    overlay.appendChild(commentsModal);

    const commentsList = commentsModal.querySelector('.tt-comments-list');
    const commentsInput = commentsModal.querySelector('.tt-comments-input');
    const commentsSend = commentsModal.querySelector('.tt-comments-send');
    const commentsClose = commentsModal.querySelector('.tt-comments-close');

    commentsClose.onclick = () => commentsModal.classList.remove('show');
    
    commentsSend.onclick = function() {
      const val = commentsInput.value.trim();
      if (!val) return;
      // Add custom user comment
      const newComment = createCommentElement(0, val, '@you');
      commentsList.insertBefore(newComment, commentsList.firstChild);
      commentsInput.value = '';
      commentsList.scrollTop = 0;
    };
    commentsInput.onkeydown = function(e) {
      if (e.key === 'Enter') commentsSend.click();
    };

    // Render slides
    const slideVideoElements = [];
    videos.forEach((video, index) => {
      const slide = document.createElement('div');
      slide.className = 'tt-slide';
      slide.dataset.index = index;

      const likesCount = video.likes_count || 255700;
      const favsCount = video.favorites_count || 12000;
      const sharesCount = video.shares_count || 8500;

      let finalSrc = optimizeCloudinaryVideoUrl(video.video_url || "");
      if (finalSrc.startsWith("/")) {
        const base = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000' : '';
        finalSrc = base + finalSrc;
      }

      let commentLabelText = "5.0k";
      if (index === 1) commentLabelText = "3.2k";
      else if (index === 2) commentLabelText = "1.8k";
      else if (index === 3) commentLabelText = "934";
      else if (index > 3) commentLabelText = (50 + Math.floor(Math.random() * 500)).toString();

      slide.innerHTML = `
        <div class="tt-video-wrapper" style="background:#000;">
          <video class="tt-video" src="${finalSrc}" loop playsinline webkit-playsinline preload="auto" muted></video>
          <i class="fa-solid fa-play tt-play-icon"></i>
          
          <!-- Floating Action Buttons -->
          <div class="tt-sidebar">
            <button class="tt-sidebar-btn" id="volumeBtn_${video.id}">
              <div class="tt-sidebar-icon"><i class="fa-solid fa-volume-xmark"></i></div>
              <span class="tt-sidebar-label">Muted</span>
            </button>
            <button class="tt-sidebar-btn" id="likeBtn_${video.id}">
              <div class="tt-sidebar-icon"><i class="fa-regular fa-heart"></i></div>
              <span class="tt-sidebar-label" id="likeCount_${video.id}" data-value="${likesCount}">${formatCount(likesCount)}</span>
            </button>
            <button class="tt-sidebar-btn" id="commentBtn_${video.id}">
              <div class="tt-sidebar-icon"><i class="fa-regular fa-comment-dots"></i></div>
              <span class="tt-sidebar-label">${commentLabelText}</span>
            </button>
            <button class="tt-sidebar-btn" id="favBtn_${video.id}">
              <div class="tt-sidebar-icon"><i class="fa-regular fa-bookmark"></i></div>
              <span class="tt-sidebar-label" id="favCount_${video.id}">${formatCount(favsCount)}</span>
            </button>
            <button class="tt-sidebar-btn" id="shareBtn_${video.id}">
              <div class="tt-sidebar-icon"><i class="fa-solid fa-share"></i></div>
              <span class="tt-sidebar-label">${formatCount(sharesCount)}</span>
            </button>
          </div>

          <!-- Video Details -->
          <div class="tt-info">
            <div class="tt-username">@GhanaCash_Official <span>Official</span></div>
            <div class="tt-desc">${video.caption || "How to earn GH₵416.67 daily with Ghana Cash secure payment system. Verified payouts and payout keys. 🚀💸 #GhanaCash #PayoutKey #MakeMoney"}</div>
            <div class="tt-music">
              <i class="fa-solid fa-compact-disc"></i> original sound - Ghana Cash Testimonial
            </div>
          </div>
        </div>
      `;

      container.appendChild(slide);

      const videoElement = slide.querySelector('.tt-video');
      const videoBg = { play: () => Promise.resolve(), pause: () => {}, muted: true };
      const playIcon = slide.querySelector('.tt-play-icon');
      const wrapper = slide.querySelector('.tt-video-wrapper');
      
      const lBtn = slide.querySelector(`#likeBtn_${video.id}`);
      const lCount = slide.querySelector(`#likeCount_${video.id}`);
      const cBtn = slide.querySelector(`#commentBtn_${video.id}`);
      const fBtn = slide.querySelector(`#favBtn_${video.id}`);
      const fCount = slide.querySelector(`#favCount_${video.id}`);
      const sBtn = slide.querySelector(`#shareBtn_${video.id}`);

      slideVideoElements.push({
        video: videoElement,
        bg: videoBg,
        playIcon: playIcon
      });

      // Track buffer load state
      videoElement.addEventListener('loadeddata', function() { markVideoLoaded(index); });
      videoElement.addEventListener('canplay', function() { markVideoLoaded(index); });
      videoElement.addEventListener('canplaythrough', function() { markVideoLoaded(index); });
      const vBtn = slide.querySelector(`#volumeBtn_${video.id}`);
      if (vBtn) {
        vBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const isMuted = !videoElement.muted;
          slideVideoElements.forEach(s => {
            s.video.muted = isMuted;
            const btn = s.video.closest('.tt-slide').querySelector(`[id^="volumeBtn_"]`);
            if (btn) {
              btn.querySelector('i').className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
              btn.querySelector('.tt-sidebar-label').textContent = isMuted ? 'Muted' : 'Unmuted';
            }
          });
        });
      }

      // Handle video click (play/pause and unmute toggle)
      videoElement.addEventListener('click', function() {
        if (videoElement.muted) {
          slideVideoElements.forEach(s => {
            s.video.muted = false;
            const btn = s.video.closest('.tt-slide').querySelector(`[id^="volumeBtn_"]`);
            if (btn) {
              btn.querySelector('i').className = 'fa-solid fa-volume-high';
              btn.querySelector('.tt-sidebar-label').textContent = 'Unmuted';
            }
          });
          const guides = overlay.querySelectorAll('.tt-mute-guide');
          guides.forEach(g => g.remove());
          return;
        }

        if (videoElement.paused) {
          videoElement.play().catch(() => {});
          videoBg.play().catch(() => {});
          playIcon.classList.remove('show');
        } else {
          videoElement.pause();
          videoBg.pause();
          playIcon.classList.add('show');
        }
      });

      // Double click to like
      wrapper.addEventListener('click', function(e) {
        if (e.target.closest('.tt-sidebar')) return;
        handleVideoDoubleTap(e, video.id, lBtn, lCount);
      });

      // Sidebar Action Handlers
      lBtn.addEventListener('click', function() {
        if (lBtn.classList.contains('liked')) {
          lBtn.classList.remove('liked');
          lBtn.querySelector('i').className = 'fa-regular fa-heart';
          let curr = parseInt(lCount.dataset.value) || 0;
          if (curr > 0) curr--;
          lCount.dataset.value = curr;
          lCount.textContent = formatCount(curr);
        } else {
          likeVideo(video.id, lBtn, lCount);
        }
      });

      cBtn.addEventListener('click', function() {
        const headerEl = commentsModal.querySelector('.tt-comments-header');
        if (headerEl) {
          headerEl.innerHTML = `
            Comments (${commentLabelText})
            <button class="tt-comments-close">✕</button>
          `;
          const closeBtn = headerEl.querySelector('.tt-comments-close');
          if (closeBtn) closeBtn.onclick = () => commentsModal.classList.remove('show');
        }
        commentsModal.classList.add('show');
        renderComments(commentsList);
      });

      fBtn.addEventListener('click', function() {
        fBtn.classList.toggle('favorited');
        const icon = fBtn.querySelector('i');
        const label = fCount;
        let count = parseInt(label.textContent.replace('k','')) * 1000;
        if (fBtn.classList.contains('favorited')) {
          icon.className = 'fa-solid fa-bookmark';
          count++;
        } else {
          icon.className = 'fa-regular fa-bookmark';
          count--;
        }
        label.textContent = formatCount(count);
      });

      sBtn.addEventListener('click', function() {
        const tempInput = document.createElement('input');
        tempInput.value = window.location.origin;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        // Show temporary toast
        const shareLabel = sBtn.querySelector('.tt-sidebar-label');
        const origText = shareLabel.textContent;
        shareLabel.textContent = "Copied!";
        shareLabel.style.color = "#10b981";
        setTimeout(() => {
          shareLabel.textContent = origText;
          shareLabel.style.color = "";
        }, 1500);
      });
    });

    // Handle scroll to active/pause videos
    let activeIndex = startIndex;
    container.addEventListener('scroll', function() {
      const height = container.clientHeight;
      const index = Math.round(container.scrollTop / height);
      if (index !== activeIndex && index >= 0 && index < videos.length) {
        // Pause old video
        if (slideVideoElements[activeIndex]) {
          slideVideoElements[activeIndex].video.pause();
          slideVideoElements[activeIndex].bg.pause();
          slideVideoElements[activeIndex].playIcon.classList.add('show');
        }
        // Play new video
        activeIndex = index;
        if (slideVideoElements[activeIndex]) {
          slideVideoElements[activeIndex].video.play().catch(() => {});
          slideVideoElements[activeIndex].bg.play().catch(() => {});
          slideVideoElements[activeIndex].playIcon.classList.remove('show');
        }
      }
    });

    document.body.appendChild(overlay);

    // Initial play after modal opens
    setTimeout(() => {
      // Scroll to start index if not 0
      if (startIndex > 0) {
        container.scrollTop = startIndex * container.clientHeight;
      }
      if (isDismissed) {
        if (slideVideoElements[activeIndex]) {
          slideVideoElements[activeIndex].video.play().catch(() => {});
          slideVideoElements[activeIndex].bg.play().catch(() => {});
          slideVideoElements[activeIndex].playIcon.classList.remove('show');
        }
      }
    }, 200);
  };
})();
