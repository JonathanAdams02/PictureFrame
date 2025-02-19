import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

console.log("Upload.js is loaded");

// ✅ Register Service Worker (Add this at the start of the file)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log("Service Worker registered successfully."))
        .catch(error => console.log("Service Worker registration failed:", error));
}

// Upload functionality
document.getElementById('uploadBtn').addEventListener('click', function() {
    console.log("Upload button clicked");
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const imageData = e.target.result;
                    
                    // ✅ Optionally store in cache for offline access
                    if ('caches' in window) {
                        caches.open('photo-cache').then(cache => {
                            cache.put(`photo-${Date.now()}`, new Response(imageData));
                        });
                    }

                    // ✅ Upload to Firestore
                    const docRef = await addDoc(collection(db, "photos"), {
                        imageData: imageData,
                        uploadedAt: new Date(),
                        displayOrder: Date.now()
                    });

                    console.log("Photo uploaded!");
                } catch (error) {
                    console.error("Error adding photo: ", error);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
});

// Load and show existing photos
const photosQuery = query(collection(db, "photos"), orderBy("displayOrder", "desc"));
onSnapshot(photosQuery, (snapshot) => {
    const photoGrid = document.getElementById('photoGrid');
    photoGrid.innerHTML = ''; // Clear existing photos
    
    snapshot.forEach((docSnapshot) => {
        const photoData = docSnapshot.data();
        
        // Create container for photo and delete button
        const container = document.createElement('div');
        container.className = 'photo-container';
        
        // Create image
        const img = document.createElement('img');
        img.src = photoData.imageData;
        img.style.width = '100%';
        img.style.height = '150px';
        img.style.objectFit = 'cover';
        
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        
        // Add delete functionality
        deleteButton.addEventListener('click', async () => {
            try {
                await deleteDoc(doc(db, "photos", docSnapshot.id));
                console.log("Photo deleted");
            } catch (error) {
                console.error("Error deleting: ", error);
            }
        });
        
        // Add everything to container
        container.appendChild(img);
        container.appendChild(deleteButton);
        photoGrid.appendChild(container);
    });
});
