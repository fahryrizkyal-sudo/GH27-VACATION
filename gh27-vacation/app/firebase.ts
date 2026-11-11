// @ts-nocheck
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5hE31B5kIGaPboCaRl7Pjv0i5CfO1B54",
  authDomain: "gh27-vacation.firebaseapp.com",
  projectId: "gh27-vacation",
  storageBucket: "gh27-vacation.firebasestorage.app",
  messagingSenderId: "466435076361",
  appId: "1:466435076361:web:90f799a536482780ee23d8",
  measurementId: "G-4H2DGQXV4B"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);