import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
                // Compress the image first
                const compressedFile = await imageCompression(file, {
                    maxWidthOrHeight: 800,
                    useWebWorker: true
                });

                // Create reader for orientation fix
                const reader = new FileReader();
                reader.onload = async function(e) {
                    try {
                        // Fix orientation using piexif
                        const image = new Image();
                        image.onload = async function() {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Get the proper orientation
                            ctx.save();
                            if (image.width > image.height) {
                                // Only modify if image is landscape and needs rotating
                                canvas.width = image.height;
                                canvas.height = image.width;
                                ctx.translate(canvas.width/2, canvas.height/2);
                                ctx.rotate(90 * Math.PI/180);
                                ctx.translate(-canvas.height/2, -canvas.width/2);
                            } else {
                                canvas.width = image.width;
                                canvas.height = image.height;
                            }
                            
                            ctx.drawImage(image, 0, 0);
                            ctx.restore();
                            
                            // Convert to data URL and upload
                            const finalImageData = canvas.toDataURL('image/jpeg');
                            
                            // Upload to Firestore
                            const docRef = await addDoc(collection(db, "photos"), {
                                imageData: finalImageData,
                                uploadedAt: new Date(),
                                displayOrder: Date.now()
                            });
                            
                            console.log("Photo uploaded successfully!");
                        };
                        image.src = e.target.result;
                    } catch (error) {
                        console.error("Error processing image:", error);
                    }
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error("Error compressing image:", error);
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