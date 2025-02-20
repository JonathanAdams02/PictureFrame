// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyChPtB_6ulU6Tmm0GXC8gCoKiMSaji7kjk",
    authDomain: "pictureframe-e780d.firebaseapp.com",
    projectId: "pictureframe-e780d",
    storageBucket: "pictureframe-e780d.firebasestorage.app",
    messagingSenderId: "679399401410",
    appId: "1:679399401410:web:a28baffd9da9938503185b",
    measurementId: "G-PJSE4T68DZ"
};

// Initialize Firebase only once
const app = initializeApp(firebaseConfig);

// Initialize Firestore and enable offline persistence
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);

// Set authentication persistence to LOCAL
// This keeps the user logged in until they explicitly log out
setPersistence(auth, browserLocalPersistence)
    .catch((error) => {
        console.error("Error setting auth persistence:", error);
    });

// Enable Firestore offline persistence
enableIndexedDbPersistence(db)
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.error("Persistence failed: Multiple tabs open");
        } else if (err.code === 'unimplemented') {
            console.error("Persistence is not supported by this browser");
        }
    });

export { db, auth };