/* eslint-disable @typescript-eslint/no-unused-vars */
// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD2-s6D-O8ThXSmvltUWazIkUUMO3PWEBw",
  authDomain: "realtime-861ca.firebaseapp.com",
  databaseURL: "https://realtime-861ca-default-rtdb.firebaseio.com",
  projectId: "realtime-861ca",
  storageBucket: "realtime-861ca.firebasestorage.app",
  messagingSenderId: "464189532638",
  appId: "1:464189532638:web:1fe0f72479d46f4b3d954f",
  measurementId: "G-ZKM1CYZL7S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();