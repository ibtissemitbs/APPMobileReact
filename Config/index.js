// Import the functions you need from the SDKs you need
//import { initializeApp } from "firebase/app";
import app from "firebase/compat/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import "firebase/compat/auth";
import "firebase/compat/database";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUVz_xMEqoIdVGbdTCK2xuzjzE11zk-Oo",
  authDomain: "wattsup-a6aa4.firebaseapp.com",
  projectId: "wattsup-a6aa4",
  storageBucket: "wattsup-a6aa4.firebasestorage.app",
  messagingSenderId: "267055822536",
  appId: "1:267055822536:web:2dad4378538746903857fd"
};

// Initialize Firebase
//const app = initializeApp(firebaseConfig);//conexion avec firebase
const firebase = app.initializeApp(firebaseConfig)
import "firebase/compat/storage";
export default firebase;

import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://ypggiwjznfysvldxhnnd.supabase.co'
const supabaseKey = "sb_publishable_AzCnbHM4g5Dwya6bIb4duA_2HjQ6rgl"
const supabase = createClient(supabaseUrl, supabaseKey)
export { supabase };