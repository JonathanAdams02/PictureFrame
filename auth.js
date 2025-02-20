import { db, auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
    }
    
    localStorage.setItem('isRegistered', 'true');
    localStorage.setItem('deviceName', deviceName);
}

// Get HTML elements
const loginContainer = document.getElementById('loginContainer');
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const userInfo = document.getElementById('userInfo');
const unregisterButton = document.getElementById('unregisterButton');

// Show/hide login form based on registration status
if (!localStorage.getItem('isRegistered')) {
    loginContainer.classList.remove('hidden');
} else {
    loginContainer.classList.add('hidden');
}

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const deviceName = document.getElementById('deviceName').value;
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await registerDevice(userCredential.user.uid, deviceName);
            loginContainer.classList.add('hidden');
        } catch (error) {
            errorMessage.textContent = 'Login failed. Please check your email and password.';
            console.error('Login error:', error);
        }
    });
}

// Handle unregister button
if (unregisterButton) {
    unregisterButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to unregister this device? You will need to register again to view photos.')) {
            try {
                await signOut(auth);
                localStorage.removeItem('isRegistered');
                localStorage.removeItem('deviceId');
                localStorage.removeItem('deviceName');
                location.reload();
            } catch (error) {
                console.error('Unregister error:', error);
            }
        }
    });
}

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
    if (user && localStorage.getItem('isRegistered')) {
        // User is signed in and device is registered
        loginContainer.classList.add('hidden');
        unregisterButton.classList.remove('hidden');
        
        // Show device info
        const deviceName = localStorage.getItem('deviceName');
        userInfo.textContent = `Device: ${deviceName}`;
        userInfo.classList.remove('hidden');
    } else {
        // User is signed out or device not registered
        if (!localStorage.getItem('isRegistered')) {
            loginContainer.classList.remove('hidden');
        }
        unregisterButton.classList.add('hidden');
        userInfo.classList.add('hidden');
    }
});