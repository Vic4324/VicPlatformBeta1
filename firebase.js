import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    update,
    push,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDGI_jX4ZeT41UpeX30BcgHKSmi1D6kp1U",
    authDomain: "vicland-3c558.firebaseapp.com",
    databaseURL: "https://vicland-3c558-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "vicland-3c558",
    storageBucket: "vicland-3c558.firebasestorage.app",
    messagingSenderId: "880543759376",
    appId: "1:880543759376:web:cf0c7b4e9fd2138cc3de95"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

export {
    db,
    ref,
    set,
    get,
    update,
    push,
    remove,
    onValue
};