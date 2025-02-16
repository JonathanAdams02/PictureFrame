import { db } from './firebase-config.js';
import { collection, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// First, let's add a console log to see if our script is loading
console.log("Upload.js is loaded");

// Add click event listener to the upload button
document.getElementById('uploadBtn').addEventListener('click', async function() {
    console.log("Upload button clicked"); // Add this to test if button click works
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    // Add to Firestore
                    await addDoc(collection(db, "photos"), {
                        imageData: e.target.result,
                        uploadedAt: new Date(),
                        displayOrder: Date.now()
                    });

                    // Add to photo grid
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.width = '100%';
                    img.style.height = '150px';
                    img.style.objectFit = 'cover';
                    
                    const photoGrid = document.getElementById('photoGrid');
                    photoGrid.appendChild(img);
                } catch (error) {
                    console.error("Error adding photo: ", error);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
});