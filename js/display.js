import { db } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

let currentIndex = 0;
let photos = [];
const photoElement = document.getElementById('current-photo');

// Initial setup of photo element
photoElement.style.opacity = 1;

// Listen for photos in real-time
const q = query(collection(db, "photos"), orderBy("displayOrder", "desc"));
onSnapshot(q, (snapshot) => {
    photos = [];
    snapshot.forEach((doc) => {
        photos.push(doc.data().imageData);
    });
    
    // Start display if we have photos and none are showing
    if (photos.length > 0 && !photoElement.src) {
        showCurrentPhoto();
    }
});

function showCurrentPhoto() {
    if (photos.length > 0) {
        // Start fade out
        photoElement.style.opacity = 0;
        
        setTimeout(() => {
            // Change photo
            const img = new Image();
            img.onload = () => {
                photoElement.src = img.src;
                photoElement.style.opacity = 1;
            };
            img.src = photos[currentIndex];
            
            // Prepare next photo index
            currentIndex = (currentIndex + 1) % photos.length;
        }, 1000);
    }
}

// Rotate every 8 seconds
setInterval(showCurrentPhoto, 8000);