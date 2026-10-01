// firebase.js — 9jaCash
// Initialize Firebase and export _9jaCash global for all pages

const firebaseConfig = {
  apiKey: "AIzaSyCWLYs4hW1bXcuEc2pYSBjxN9ApWUjmxh8",
  authDomain: "confirm-deposits.firebaseapp.com",
  projectId: "confirm-deposits",
  storageBucket: "confirm-deposits.firebasestorage.app",
  messagingSenderId: "927666910567",
  appId: "1:927666910567:web:f26b51d979f95666ebabc2",
  measurementId: "G-T6LM5QFM3D"
};


// Initialize Firebase
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');

  // Create the _9jaCash global object that ALL pages expect
  window._9jaCash = {
    app: firebase.app(),
    db: firebase.firestore(),
    auth: firebase.auth(),
    analytics: firebase.analytics ? firebase.analytics() : null
  };

  console.log('_9jaCash ready:', !!window._9jaCash.db);
} else {
  console.warn('Firebase SDK not loaded');
}

// Also keep old export for compatibility
window.firebaseApp = firebase;

// Create first admin account helper (run once in console)
async function createFirstAdmin(email, password) {
  try {
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    await firebase.firestore().collection('admins').doc(user.uid).set({
      email: email,
      role: 'admin',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });
    
    console.log('Admin created successfully:', user.uid);
    return user;
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

window.createFirstAdmin = createFirstAdmin;
