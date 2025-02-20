import { db, auth } from '../firebase-config.js';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import './auth.js';

// Only initialize upload functionality if user is authenticated
const initializeUpload = () => {
    // Upload functionality
    document.getElementById('uploadBtn').addEventListener('click', function() {
        if (!auth.currentUser) {
            alert('Please register this device first to upload photos.');
            return;
        }

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
                                
                                // Add user information to upload
                                const docRef = await addDoc(collection(db, "photos"), {
                                    imageData: finalImageData,
                                    uploadedAt: new Date(),
                                    displayOrder: Date.now(),
                                    uploadedBy: auth.currentUser.email,
                                    deviceId: localStorage.getItem('deviceId')
                                });
                                
                                console.log("Photo uploaded successfully!");
                            };
                            image.src = e.target.result;
                        } catch (error) {
                            console.error("Error processing image:", error);
                            alert('Error processing image. Please try again.');
                        }
                    };
                    reader.readAsDataURL(compressedFile);
                } catch (error) {
                    console.error("Error compressing image:", error);
                    alert('Error compressing image. Please try again.');
                }
            }
        };
        
        input.click();
    });
};

// Load and show existing photos
const initializePhotoGrid = () => {
    const photosQuery = query(collection(db, "photos"), orderBy("displayOrder", "desc"));
    onSnapshot(photosQuery, (snapshot) => {
        const photoGrid = document.getElementById('photoGrid');
        photoGrid.innerHTML = ''; // Clear existing photos
        
        snapshot.forEach((docSnapshot) => {
            const photoData = docSnapshot.data();
            
            // Create container for photo and buttons
            const container = document.createElement('div');
            container.className = 'photo-container';
            
            // Create image
            const img = document.createElement('img');
            img.src = photoData.imageData;
            img.style.width = '100%';
            img.style.height = '150px';
            img.style.objectFit = 'cover';
            
            // Add upload info if available
            if (photoData.uploadedBy) {
                const uploadInfo = document.createElement('div');
                uploadInfo.className = 'upload-info';
                uploadInfo.textContent = `Uploaded by: ${photoData.uploadedBy}`;
                uploadInfo.style.fontSize = '12px';
                uploadInfo.style.color = '#666';
                uploadInfo.style.marginTop = '4px';
                container.appendChild(uploadInfo);
            }
            
            // Only show delete button for photos uploaded from this device
            if (photoData.deviceId === localStorage.getItem('deviceId')) {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete-btn';
                
                deleteButton.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete this photo?')) {
                        try {
                            await deleteDoc(doc(db, "photos", docSnapshot.id));
                            console.log("Photo deleted");
                        } catch (error) {
                            console.error("Error deleting: ", error);
                            alert('Error deleting photo. Please try again.');
                        }
                    }
                });
                container.appendChild(deleteButton);
            }

            // Add rotate button
            const rotateButton = document.createElement('button');
            rotateButton.textContent = '🔄';
            rotateButton.className = 'rotate-btn';
            
            rotateButton.addEventListener('click', async () => {
                try {
                    const image = new Image();
                    image.onload = async function() {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = image.height;
                        canvas.height = image.width;
                        
                        ctx.translate(canvas.width/2, canvas.height/2);
                        ctx.rotate(90 * Math.PI/180);
                        ctx.translate(-canvas.height/2, -canvas.width/2);
                        
                        ctx.drawImage(image, 0, 0);
                        
                        const rotatedImageData = canvas.toDataURL('image/jpeg');
                        
                        // Preserve the original upload information
                        await addDoc(collection(db, "photos"), {
                            imageData: rotatedImageData,
                            uploadedAt: new Date(),
                            displayOrder: Date.now(),
                            uploadedBy: photoData.uploadedBy,
                            deviceId: photoData.deviceId
                        });
                        
                        await deleteDoc(doc(db, "photos", docSnapshot.id));
                    };
                    image.src = photoData.imageData;
                } catch (error) {
                    console.error("Error rotating photo:", error);
                    alert('Error rotating photo. Please try again.');
                }
            });

            // Add elements to container
            container.appendChild(img);
            container.appendChild(rotateButton);
            photoGrid.appendChild(container);
        });
    });
};

// Initialize once auth state is confirmed
auth.onAuthStateChanged((user) => {
    if (user && localStorage.getItem('isRegistered')) {
        initializeUpload();
        initializePhotoGrid();
    }
});

// Add some basic styles
const style = document.createElement('style');
style.textContent = `
    .photo-container {
        position: relative;
        margin-bottom: 1rem;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .delete-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255, 0, 0, 0.7);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
    }

    .rotate-btn {
        position: absolute;
        top: 12px;
        right: ${localStorage.getItem('deviceId') ? '70px' : '12px'};
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
    }

    .delete-btn:hover, .rotate-btn:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);