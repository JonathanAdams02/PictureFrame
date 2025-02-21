import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyChPtB_6ulU6Tmm0GXC8gCoKiMSaji7kjk",
    authDomain: "pictureframe-e780d.firebaseapp.com",
    projectId: "pictureframe-e780d",
    storageBucket: "pictureframe-e780d.firebasestorage.app",
    messagingSenderId: "679399401410",
    appId: "1:679399401410:web:a28baffd9da9938503185b",
    measurementId: "G-PJSE4T68DZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistence
const db = getFirestore(app);
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.error("Persistence failed: Multiple tabs open");
        } else if (err.code === 'unimplemented') {
            console.error("Persistence is not supported by this browser");
        }
    });

// Initialize Auth with explicit settings
const auth = getAuth(app);
auth.settings = {
    appVerificationDisabledForTesting: true  // This might help with the domain verification
};

// Log the current auth domain
console.log('Current auth domain:', auth.config.authDomain);
console.log('Current window location:', window.location.hostname);

export { db, auth };