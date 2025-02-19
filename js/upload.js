import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                // Read the file as a Data URL
                const reader = new FileReader();
                reader.onload = async function(readerEvent) {
                    const imageData = readerEvent.target.result;

                    // Check and correct orientation using piexifjs
                    const correctedImageData = await correctImageOrientation(imageData);

                    // Compress the image
                    const options = {
                    maxWidthOrHeight: 800, // Adjust size as needed
                    useWebWorker: true // Option to use web workers for performance
                    };

                    const compressedFile = await imageCompression(correctedImageData, options);

                    // Convert the compressed file to a Data URL
                    const compressedReader = new FileReader();
                    compressedReader.onload = async function(compressedReaderEvent) {
                        const compressedImageData = compressedReaderEvent.target.result;

                        // ✅ Optionally store in cache for offline access
                        if ('caches' in window) {
                            caches.open('photo-cache').then(cache => {
                                cache.put(`photo-${Date.now()}`, new Response(compressedImageData));
                            });
                        }

                        // ✅ Upload to Firestore
                        const docRef = await addDoc(collection(db, "photos"), {
                            imageData: compressedImageData,
                            uploadedAt: new Date(),
                            displayOrder: Date.now()
                        });

                        console.log("Photo uploaded!");
                    };
                    compressedReader.readAsDataURL(compressedFile);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error correcting or uploading the image: ", error);
            }
        }
    };

    input.click();
});

// Function to correct the orientation using EXIF data
async function correctImageOrientation(imageData) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            // Get EXIF data and correct the orientation if necessary
            const exifData = piexif.load(imageData);
            const orientation = exifData["0th"][piexif.ImageIFD.Orientation];

            if (orientation && orientation !== 1) {
                // Correct orientation using canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set canvas size
                canvas.width = img.width;
                canvas.height = img.height;

                // Rotate image according to EXIF orientation
                switch (orientation) {
                    case 6:
                        canvas.width = img.height;
                        canvas.height = img.width;
                        ctx.rotate(90 * Math.PI / 180);
                        ctx.drawImage(img, 0, -img.height);
                        break;
                    case 3:
                        ctx.rotate(180 * Math.PI / 180);
                        ctx.drawImage(img, -img.width, -img.height);
                        break;
                    case 8:
                        canvas.width = img.height;
                        canvas.height = img.width;
                        ctx.rotate(-90 * Math.PI / 180);
                        ctx.drawImage(img, -img.width, 0);
                        break;
                    default:
                        ctx.drawImage(img, 0, 0);
                        break;
                }

                // Return the corrected image as Data URL
                const correctedImageData = canvas.toDataURL();
                resolve(correctedImageData);
            } else {
                resolve(imageData); // No correction needed
            }
        };

        img.onerror = function() {
            reject(new Error("Failed to load image for orientation correction"));
        };

        img.src = imageData;
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
