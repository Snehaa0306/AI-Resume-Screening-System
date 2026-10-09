import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBrfSd_F0a_lXWhtI677_0aXxxAQq1b2s0",
  authDomain: "resumescreen-f6b37.firebaseapp.com",
  projectId: "resumescreen-f6b37",
  storageBucket: "resumescreen-f6b37.firebasestorage.app",
  messagingSenderId: "528655824298",
  appId: "1:528655824298:web:1baf0653e53492737d67d3"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);