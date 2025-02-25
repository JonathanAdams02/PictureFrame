import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAbVkwkTC5rO8_IJWy7ys7_Dil7oWU7ew0",
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

// Set persistence to INDEXED_DB for maximum persistence
setPersistence(auth, indexedDBLocalPersistence)
    .then(() => {
        console.log("Using indexedDB persistence for maximum session length");
    })
    .catch((error) => {
        console.error("Error setting persistence:", error);
        // Fall back to localStorage
        return setPersistence(auth, browserLocalPersistence);
    });

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