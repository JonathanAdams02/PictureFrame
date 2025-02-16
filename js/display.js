import { db } from './firebase-config.js';
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

let currentIndex = 0;
let photos = [];
const photoElement = document.getElementById('current-photo');

// Listen for photos in real-time
const q = query(collection(db, "photos"), orderBy("displayOrder", "desc"));
onSnapshot(q, (snapshot) => {
    photos = [];
    snapshot.forEach((doc) => {
        photos.push(doc.data().imageData);
    });
    
    if (photos.length > 0 && !photoElement.src) {
        showCurrentPhoto();
    }
});

function showCurrentPhoto() {
    if (photos.length > 0) {
        photoElement.classList.add('fade-out');
        
        setTimeout(() => {
            photoElement.src = photos[currentIndex];
            photoElement.classList.remove('fade-out');
            currentIndex = (currentIndex + 1) % photos.length;
        }, 1000);
    }
}

// Rotate every 5 seconds
setInterval(showCurrentPhoto, 5000);