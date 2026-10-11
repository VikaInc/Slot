import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmr4MXwrPGAEgHqjw11oIYUdOVojtcKWw",
  authDomain: "slot-hz.firebaseapp.com",
  projectId: "slot-hz",
  storageBucket: "slot-hz.firebasestorage.app",
  messagingSenderId: "648298401967",
  appId: "1:648298401967:web:111dfa7d21a1517580c45a"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);