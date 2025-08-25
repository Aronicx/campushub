
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "campus-hub-wmhbw",
  appId: "1:162991212051:web:456c009133bca5dcd3e1e6",
  storageBucket: "campus-hub-wmhbw.firebasestorage.app",
  apiKey: "AIzaSyBNLeAcRUo_Lix-HeVyikDMK_HJW6uDVVM",
  authDomain: "campus-hub-wmhbw.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "162991212051",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
