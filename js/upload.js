import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// First, let's add a console log to see if our script is loading
console.log("Upload.js is loaded");

// Add click event listener to the upload button
document.getElementById('uploadBtn').addEventListener('click', function() {
    console.log("Upload button clicked"); // Add this to test if button click works
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log("File selected:", file.name); // Add this to test file selection
            const reader = new FileReader();
            reader.onload = async function(e) {
                console.log("File read successfully"); // Add this to test file reading
                
                try {
                    // Add to Firestore
                    const docRef = await addDoc(collection(db, "photos"), {
                        imageData: e.target.result,
                        uploadedAt: new Date(),
                        displayOrder: Date.now()
                    });
                    console.log("Document written with ID: ", docRef.id);

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