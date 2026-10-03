const axios = require('axios');

/*
 * GhanaCash account-name lookup (Paystack "Resolve Account Number", Ghana).
 *
 * Called by the signup page:
 *   GET /.netlify/functions/verify-account
 *     ?type=momo&account_number=0241234567&network=MTN%20Mobile%20Money   (network = optional prefix guess)
 *     ?type=bank&account_number=1234567890123&bank_name=GCB%20Bank
 *
 * Responds: { status:true, count, data:[{ bankName, bankCode, accountName, accountNumber }] }
 * Bank codes are NOT hard-coded: the Ghana list is pulled from Paystack and cached,
 * so codes stay correct. Env var needed: PAYSTACK_SECRET_KEY
 */

const PAYSTACK = 'https://api.paystack.co';
const TIMEOUT = 6000;

// Canonical MoMo names (what the signup page shows/saves) + words to find them
// in Paystack's mobile-money list. `fallback` is only used if that list can't be fetched.
const MOMO_NETWORKS = [
  { name: 'MTN Mobile Money', keywords: ['mtn'],                           fallback: 'MTN' },
  { name: 'Telecel Cash',     keywords: ['telecel', 'vodafone', 'vod'],    fallback: 'VOD' },
  { name: 'AirtelTigo Money', keywords: ['airteltigo', 'airtel', 'tigo'],  fallback: 'ATL' }
];

// Bank names used in the signup dropdown -> words to find them in Paystack's Ghana bank list
const BANK_ALIASES = {
  'Absa Bank Ghana': ['absa'],
  'Access Bank Ghana': ['access'],
  'Agricultural Development Bank (ADB)': ['agricultural development', 'adb'],
  'Bank of Africa Ghana': ['bank of africa', 'boa'],
  'CalBank': ['calbank', 'cal bank'],
  'Consolidated Bank Ghana (CBG)': ['consolidated bank', 'cbg'],
  'Ecobank Ghana': ['ecobank'],
  'Fidelity Bank Ghana': ['fidelity'],
  'First Atlantic Bank': ['first atlantic'],
  'First National Bank Ghana': ['first national', 'fnb'],
  'GCB Bank': ['gcb'],
  'GTBank Ghana': ['guaranty trust', 'gtbank', 'gt bank', 'gtb'],
  'National Investment Bank (NIB)': ['national investment', 'nib'],
  'OmniBSIC Bank': ['omnibsic', 'omni bsic', 'omni'],
  'Prudential Bank': ['prudential'],
  'Republic Bank Ghana': ['republic'],
  'Societe Generale Ghana': ['societe generale', 'sg ghana', 'sg'],
  'Stanbic Bank Ghana': ['stanbic'],
  'Standard Chartered Bank Ghana': ['standard chartered'],
  'United Bank for Africa (UBA) Ghana': ['united bank for africa', 'uba'],
  'Universal Merchant Bank (UMB)': ['universal merchant', 'umb'],
  'Zenith Bank Ghana': ['zenith']
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const norm = (s) =>
  ' ' + String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';

// whole-word match so short keys like "nib" or "uba" don't hit unrelated names
const hasWord = (haystack, kw) => norm(haystack).includes(norm(kw));

const authHeaders = () => ({ Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` });

// ---- Paystack bank list (cached between warm invocations) ----
let listCache = { at: 0, banks: [], momo: [] };
const LIST_TTL = 6 * 60 * 60 * 1000;

async function getLists() {
  if (Date.now() - listCache.at < LIST_TTL && listCache.banks.length) return listCache;
  const res = await axios.get(`${PAYSTACK}/bank`, {
    params: { country: 'ghana', perPage: 100 },
    headers: authHeaders(),
    timeout: TIMEOUT
  });
  const all = (res.data && res.data.data) || [];
  const momo = all.filter((b) => b.type === 'mobile_money');
  const banks = all.filter((b) => b.type !== 'mobile_money');
  if (!all.length) throw new Error('empty bank list');
  listCache = { at: Date.now(), banks, momo };
  return listCache;
}

// returns { name } on success, null if "not found", throws on auth/service problems
async function resolve(accountNumber, bankCode) {
  try {
    const res = await axios.get(`${PAYSTACK}/bank/resolve`, {
      params: { account_number: accountNumber, bank_code: bankCode },
      headers: authHeaders(),
      timeout: TIMEOUT
    });
    if (res.data && res.data.status && res.data.data && res.data.data.account_name) {
      return { name: res.data.data.account_name };
    }
    return null;
  } catch (e) {
    const code = e.response && e.response.status;
    if (code === 401 || code === 403 || code === 429) throw e; // key / rate-limit problem, not "no match"
    return null; // 422 etc. = account not found for that bank/network
  }
}

async function lookupMomo(accountNumber, networkHint) {
  let momoList = [];
  try { momoList = (await getLists()).momo; } catch (e) { /* use fallback codes */ }

  const candidates = MOMO_NETWORKS.map((n) => {
    const found = momoList.find((b) => n.keywords.some((k) => hasWord(b.name, k) || hasWord(b.code, k)));
    return { name: n.name, code: found ? found.code : n.fallback };
  });

  // try the network the prefix points to first; only fall back to the others if it fails
  const hinted = candidates.filter((c) => c.name === networkHint);
  const others = candidates.filter((c) => c.name !== networkHint);

  for (const group of [hinted, others]) {
    if (!group.length) continue;
    const results = await Promise.all(
      group.map(async (c) => {
        const r = await resolve(accountNumber, c.code);
        return r ? { bankName: c.name, bankCode: c.code, accountName: r.name, accountNumber } : null;
      })
    );
    const matches = results.filter(Boolean);
    if (matches.length) return matches;
  }
  return [];
}

async function lookupBank(accountNumber, bankName) {
  const aliases = BANK_ALIASES[bankName];
  if (!aliases) return { unsupported: true, matches: [] };

  const { banks } = await getLists();
  const codes = banks.filter((b) => aliases.some((k) => hasWord(b.name, k)));
  if (!codes.length) return { unsupported: true, matches: [] };

  const results = await Promise.all(
    codes.map(async (b) => {
      const r = await resolve(accountNumber, b.code);
      return r ? { bankName, bankCode: b.code, accountName: r.name, accountNumber } : null;
    })
  );
  return { unsupported: false, matches: results.filter(Boolean) };
}

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const type = q.type === 'momo' ? 'momo' : 'bank';
  const accountNumber = String(q.account_number || '').trim();

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return json(500, { status: false, message: 'Verification service not configured' });
  }

  if (type === 'momo') {
    if (!/^0\d{9}$/.test(accountNumber)) {
      return json(400, { status: false, message: 'MoMo number must be 10 digits (e.g. 0241234567)' });
    }
  } else if (!/^\d{10,16}$/.test(accountNumber)) {
    return json(400, { status: false, message: 'Bank account number must be 10–16 digits' });
  }

  try {
    let matches = [];

    if (type === 'momo') {
      matches = await lookupMomo(accountNumber, q.network);
    } else {
      if (!q.bank_name) {
        return json(400, { status: false, message: 'Select a bank first' });
      }
      const r = await lookupBank(accountNumber, q.bank_name);
      if (r.unsupported) {
        return json(404, { status: false, message: 'Name lookup is not available for this bank. Please enter your name manually.' });
      }
      matches = r.matches;
    }

    if (matches.length === 0) {
      return json(404, {
        status: false,
        message: type === 'momo'
          ? 'No MoMo account found for this number'
          : 'No account found for this bank and number'
      });
    }

    return json(200, { status: true, count: matches.length, data: matches });
  } catch (error) {
    const code = error.response && error.response.status;
    console.error('verify-account error:', code || '', error.message);
    return json(code === 429 ? 429 : 500, {
      status: false,
      message: code === 429 ? 'Too many lookups, try again shortly' : 'Verification service error'
    });
  }
};
