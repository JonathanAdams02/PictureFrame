import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// ✅ Register Service Worker (Add this at the start of the file)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/PictureFrame/service-worker.js')
        .then(() => console.log("Service Worker registered successfully."))
        .catch(error => console.log("Service Worker registration failed:", error));
}

// Function to fix orientation
function fixImageOrientation(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const exif = piexif.load(arrayBuffer);
            const orientation = exif['0th'][piexif.ImageIFD.Orientation];

            let img = new Image();
            img.onload = function() {
                let canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');

                // Adjust orientation based on EXIF data
                if (orientation > 1) {
                    canvas.width = img.height;
                    canvas.height = img.width;
                    ctx.rotate(orientation * 90 * Math.PI / 180);
                    ctx.drawImage(img, 0, -img.height);
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                }
                canvas.toBlob(resolve, file.type);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Compress and Upload functionality
document.getElementById('uploadBtn').addEventListener('click', function() {
    console.log("Upload button clicked");
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                // Step 1: Fix the orientation based on EXIF
                const correctedFile = await fixImageOrientation(file);

                // Step 2: Compress the image before uploading
                const compressedFile = await imageCompression(correctedFile, {
                    maxWidthOrHeight: 800, // Set max width or height to compress
                    useWebWorker: true
                });

                const reader = new FileReader();
                reader.onload = async function(e) {
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
                };

                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Error during image processing or upload: ", error);
            }
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
