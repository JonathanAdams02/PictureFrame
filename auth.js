import { db, auth } from '/PictureFrame/firebase-config.js';
import { 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Function to generate a unique device ID
function generateDeviceId() {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Function to get or create device ID
function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
}

// Function to register device
async function registerDevice(userId, deviceName) {
    const deviceId = getDeviceId();
    const devicesRef = collection(db, "devices");
    
    try {
        // Check if device is already registered
        const q = query(devicesRef, where("deviceId", "==", deviceId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            // Register new device
            await addDoc(devicesRef, {
                deviceId: deviceId,
                userId: userId,
                deviceName: deviceName,
                registeredAt: new Date(),
                lastUsed: new Date()
            });
        } else {
            // Update last used timestamp
            const docRef = doc(db, "devices", querySnapshot.docs[0].id);
            await updateDoc(docRef, {
                lastUsed: new Date()
            });
        }
        
        localStorage.setItem('isRegistered', 'true');
        localStorage.setItem('deviceName', deviceName);
        
        return true;
    } catch (error) {
        console.error('Error registering device:', error);
        return false;
    }
}

// Get HTML elements
const loginContainer = document.getElementById('loginContainer');
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const userInfo = document.getElementById('userInfo');
const unregisterButton = document.getElementById('unregisterButton');

// Show login form if not registered
if (!localStorage.getItem('isRegistered')) {
    if (loginContainer) loginContainer.classList.remove('hidden');
} else {
    if (loginContainer) loginContainer.classList.add('hidden');
}

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent form from submitting normally
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const deviceName = document.getElementById('deviceName').value;
        
        try {
            // First try to sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Then register the device
            const registered = await registerDevice(userCredential.user.uid, deviceName);
            
            if (registered) {
                if (loginContainer) loginContainer.classList.add('hidden');
                if (userInfo) {
                    userInfo.textContent = `Device: ${deviceName}`;
                    userInfo.classList.remove('hidden');
                }
                if (unregisterButton) {
                    unregisterButton.classList.remove('hidden');
                }
            } else {
                throw new Error('Failed to register device');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (errorMessage) errorMessage.textContent = 'Login failed. Please check your email and password.';
        }
    });
}

// Handle unregister button
if (unregisterButton) {
    unregisterButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to unregister this device? You will need to register again to upload photos.')) {
            try {
                await signOut(auth);
                localStorage.removeItem('isRegistered');
                localStorage.removeItem('deviceId');
                localStorage.removeItem('deviceName');
                localStorage.removeItem('_firebaseUser'); // Clear Safari PWA data too
                location.reload();
            } catch (error) {
                console.error('Unregister error:', error);
            }
        }
    });
}

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'User is signed in' : 'User is signed out');
    
    if (user && localStorage.getItem('isRegistered')) {
        // User is signed in and device is registered
        // Hide the login modal or container
        if (loginContainer) {
            loginContainer.classList.add('hidden'); // Hides the login container
            loginContainer.style.display = 'none'; // Make sure modal is hidden
        }

        // Show unregister button
        if (unregisterButton) unregisterButton.classList.remove('hidden');
        
        // Show device info
        if (userInfo) {
            const deviceName = localStorage.getItem('deviceName');
            userInfo.textContent = `Device: ${deviceName}`;
            userInfo.classList.remove('hidden');
        }
        
        // Update last used timestamp
        refreshDeviceTimestamp();
    } else {
        // User is signed out or device not registered
        if (!localStorage.getItem('isRegistered')) {
            if (loginContainer) loginContainer.classList.remove('hidden');
        }
        if (unregisterButton) unregisterButton.classList.add('hidden');
        if (userInfo) userInfo.classList.add('hidden');
    }
});

// Function to update device last used timestamp
async function refreshDeviceTimestamp() {
    const deviceId = localStorage.getItem('deviceId');
    if (!deviceId) return;
    
    try {
        const deviceRef = collection(db, "devices");
        const q = query(deviceRef, where("deviceId", "==", deviceId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const docRef = doc(db, "devices", snapshot.docs[0].id);
            await updateDoc(docRef, {
                lastUsed: new Date()
            });
            console.log("Device timestamp updated");
        }
    } catch (err) {
        console.error("Error updating device timestamp:", err);
    }
}

// Safari PWA authentication helper
function handleSafariPWA() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         navigator.standalone === true;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
                    /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isStandalone && isSafari) {
        console.log("Safari PWA mode detected");
        
        // When user signs in, save credentials in localStorage for Safari PWA
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Store minimal user info in localStorage for Safari PWA
                console.log("Saving Safari PWA auth state");
                localStorage.setItem('_firebaseUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email
                }));
            } else {
                localStorage.removeItem('_firebaseUser');
            }
        });
        
        // On Safari PWA startup, check if we have stored credentials
        const storedUser = localStorage.getItem('_firebaseUser');
        if (storedUser && localStorage.getItem('isRegistered')) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log("Found stored Safari PWA credentials");
                
                // Check if device is still valid
                const deviceId = localStorage.getItem('deviceId');
                if (deviceId) {
                    const deviceRef = collection(db, "devices");
                    const q = query(deviceRef, 
                        where("deviceId", "==", deviceId)
                    );
                    
                    getDocs(q).then((snapshot) => {
                        if (!snapshot.empty) {
                            console.log("Device registration confirmed for Safari PWA");
                            
                            // Update timestamp
                            const docRef = doc(db, "devices", snapshot.docs[0].id);
                            updateDoc(docRef, {
                                lastUsed: new Date()
                            }).catch(err => console.error("Error updating Safari PWA timestamp:", err));
                            
                            // Force UI update
                            if (loginContainer) loginContainer.classList.add('hidden');
                            if (loginContainer) loginContainer.style.display = 'none';
                            
                            if (userInfo) {
                                const deviceName = localStorage.getItem('deviceName');
                                userInfo.textContent = `Device: ${deviceName}`;
                                userInfo.classList.remove('hidden');
                            }
                            
                            if (unregisterButton) unregisterButton.classList.remove('hidden');
                        } else {
                            console.warn("Device not found in database, clearing Safari PWA state");
                            localStorage.removeItem('isRegistered');
                            localStorage.removeItem('deviceId');
                            localStorage.removeItem('_firebaseUser');
                            if (loginContainer) loginContainer.classList.remove('hidden');
                        }
                    }).catch(err => console.error("Error checking device:", err));
                }
            } catch (error) {
                console.error("Error processing Safari PWA auth:", error);
            }
        }
    }
}

// Enhance session persistence for PWA
function ensureAuthPersistence() {
    // Check if stored credentials match current auth state
    const isRegistered = localStorage.getItem('isRegistered');
    const deviceId = localStorage.getItem('deviceId');
    
    if (isRegistered && deviceId) {
        console.log("Verifying device registration on startup");
        
        // Force auth check on startup
        const currentUser = auth.currentUser;
        if (currentUser) {
            console.log("User already authenticated on startup");
            refreshDeviceTimestamp();
        } else {
            console.log("Waiting for auth state to resolve");
            // onAuthStateChanged will handle the rest
        }
    }
}

// Call Safari handler before persistence check
handleSafariPWA();

// Call this function when the page loads
ensureAuthPersistence();