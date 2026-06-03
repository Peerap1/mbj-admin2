// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBIxa5tK5x44qTQsdyPL_QkJxCt613seHw",
  authDomain: "mbj-admin.firebaseapp.com",
  projectId: "mbj-admin",
  storageBucket: "mbj-admin.firebasestorage.app",
  messagingSenderId: "922634034449",
  appId: "1:922634034449:web:3d7a686a100071b81a80b0",
  measurementId: "G-CQSV8BB2RM",
  databaseURL: "https://mbj-admin-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export default app;
