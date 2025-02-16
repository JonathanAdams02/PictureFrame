import { db } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

let currentIndex = 0;
const photoElement = document.getElementById('current-photo');

// Listen for photos in real-time
const q = query(collection(db, "photos"), orderBy("displayOrder"));
onSnapshot(q, (snapshot) => {
    const photos = [];
    snapshot.forEach((doc) => {
        photos.push(doc.data().imageData);
    });
    
    if (photos.length > 0) {
        photoElement.src = photos[currentIndex];
        currentIndex = (currentIndex + 1) % photos.length;
    }
});

// Rotate every 5 seconds
setInterval(() => {
    const photos = document.querySelectorAll('#photoGrid img');
    if (photos.length > 0) {
        photoElement.classList.add('fade-out');
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % photos.length;
            photoElement.src = photos[currentIndex].src;
            photoElement.classList.remove('fade-out');
        }, 1000);
    }
}, 5000);