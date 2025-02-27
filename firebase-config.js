import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "pictureframe-e780d.firebaseapp.com",
    projectId: "pictureframe-e780d",
    storageBucket: "pictureframe-e780d.firebasestorage.app",
    messagingSenderId: "679399401410",
    appId: "1:679399401410:web:a28baffd9da9938503185b",
    measurementId: "G-PJSE4T68DZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth before Firestore
const auth = getAuth(app);

// Detect if running as PWA on Safari
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     navigator.standalone === true;
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                /iPad|iPhone|iPod/.test(navigator.userAgent);

console.log("App mode:", isStandalone ? "PWA/Standalone" : "Browser", 
            isSafari ? "Safari" : "Not Safari");

// Set persistence strategy based on environment
if (isStandalone && isSafari) {
    console.log("Using special Safari PWA persistence");
    // For Safari PWA we'll handle persistence manually in auth.js
    setPersistence(auth, browserLocalPersistence)
        .then(() => console.log("Using browserLocalPersistence for Safari PWA"))
        .catch(error => console.error("Error setting Safari persistence:", error));
} else {
    // Use normal persistence for other browsers
    setPersistence(auth, indexedDBLocalPersistence)
        .then(() => console.log("Using indexedDB persistence"))
        .catch((error) => {
            console.error("Error setting persistence:", error);
            return setPersistence(auth, browserLocalPersistence);
        });
}

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

// Debug logging
console.log('Current auth domain:', window.location.hostname);

export { db, auth };