import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import piexif from 'https://cdn.jsdelivr.net/npm/piexifjs@1.0.3/dist/piexif.min.js';

console.log("Upload.js is loaded");

// ✅ Register Service Worker (Add this at the start of the file)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/PictureFrame/service-worker.js')
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
                    let imageData = e.target.result;

                    // ✅ Correct image orientation based on EXIF data
                    const correctedImage = await correctOrientation(imageData);

                    // ✅ Optionally store in cache for offline access
                    if ('caches' in window) {
                        caches.open('photo-cache').then(cache => {
                            cache.put(`photo-${Date.now()}`, new Response(correctedImage));
                        });
                    }

                    // ✅ Upload to Firestore
                    const docRef = await addDoc(collection(db, "photos"), {
                        imageData: correctedImage,
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

// Function to correct orientation based on EXIF
async function correctOrientation(imageData) {
    const image = new Image();
    image.src = imageData;
    
    return new Promise((resolve, reject) => {
        image.onload = function() {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            const exifData = piexif.load(imageData);
            const orientation = exifData['0th'][piexif.OFFSETs.Orientation];

            // Set canvas dimensions based on the image size
            canvas.width = image.width;
            canvas.height = image.height;

            // Correct orientation based on EXIF data
            switch (orientation) {
                case 3:
                    ctx.rotate(180 * Math.PI / 180);
                    ctx.drawImage(image, -image.width, -image.height);
                    break;
                case 6:
                    canvas.width = image.height;
                    canvas.height = image.width;
                    ctx.rotate(90 * Math.PI / 180);
                    ctx.drawImage(image, 0, -image.height);
                    break;
                case 8:
                    canvas.width = image.height;
                    canvas.height = image.width;
                    ctx.rotate(-90 * Math.PI / 180);
                    ctx.drawImage(image, -image.width, 0);
                    break;
                default:
                    ctx.drawImage(image, 0, 0);
            }

            // Return corrected image as base64
            resolve(canvas.toDataURL('image/jpeg'));
        };
        image.onerror = function() {
            reject("Error loading image for orientation correction.");
        };
    });
}

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
