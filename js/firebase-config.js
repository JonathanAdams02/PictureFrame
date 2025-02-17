// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBaYnr0rfwB39FHn7Xi8Q7gQ6P5gn__dnw",
    authDomain: "pictureframe-3c791.firebaseapp.com",
    projectId: "pictureframe-3c791",
    storageBucket: "pictureframe-3c791.firebasestorage.app",
    messagingSenderId: "381426967485",
    appId: "1:381426967485:web:54259cd7bfa5b84afbe8d4",
    measurementId: "G-DDBKT3ZGZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export for use in other files
export { db };