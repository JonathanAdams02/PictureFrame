import { db } from '/PictureFrame/firebase-config.js';  // Fix the import path
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    let currentIndex = 0;
    let photos = [];
    const photoElement = document.getElementById('current-photo');

    // Make sure the photo element exists
    if (!photoElement) {
        console.error("Could not find photo element with id 'current-photo'");
        return;
    }

    // Initial setup of photo element
    photoElement.style.opacity = 1;

    // Listen for photos in real-time
    const q = query(collection(db, "photos"), orderBy("displayOrder", "desc"));
    onSnapshot(q, (snapshot) => {
        photos = [];
        snapshot.forEach((doc) => {
            photos.push(doc.data().imageData);
        });
        
        console.log(`Loaded ${photos.length} photos from Firestore`);
        
        // Start display if we have photos
        if (photos.length > 0) {
            if (!photoElement.src || photoElement.src === '') {
                console.log("Starting initial photo display");
                showCurrentPhoto();
            }
        } else {
            console.log("No photos available to display");
        }
    });

    function showCurrentPhoto() {
        if (photos.length > 0) {
            // Start fade out
            photoElement.classList.add('fade-out');
            photoElement.classList.remove('fade-in');
            
            setTimeout(() => {
                // Change photo
                photoElement.src = photos[currentIndex];
                
                // Force browser to load the new image before fading in
                setTimeout(() => {
                    photoElement.classList.remove('fade-out');
                    photoElement.classList.add('fade-in');
                    
                    // Prepare next photo index
                    currentIndex = (currentIndex + 1) % photos.length;
                }, 50);
            }, 1000);
        }
    }

    // Rotate every 8 seconds
    setInterval(showCurrentPhoto, 8000);
});