// /js/auth/signup.js

import { auth, db } from "../firebase/config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elements
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const signupBtn = document.getElementById("signup-btn");
const errorMsg = document.getElementById("error-msg");

// Convert username → fake email
function usernameToEmail(username) {
  return username.toLowerCase() + "@poker.app";
}

// Validate username
function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,15}$/.test(username);
}

// Check if username already exists
async function isUsernameTaken(username) {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// Signup handler
signupBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  errorMsg.textContent = "";

  // Validation
  if (!username || !password || !confirmPassword) {
    errorMsg.textContent = "Please fill in all fields.";
    return;
  }

  if (!isValidUsername(username)) {
    errorMsg.textContent = "Username must be 3-15 characters (letters, numbers, underscore).";
    return;
  }

  if (password.length < 6) {
    errorMsg.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (password !== confirmPassword) {
    errorMsg.textContent = "Passwords do not match.";
    return;
  }

  try {
    // Check username uniqueness
    const taken = await isUsernameTaken(username);
    if (taken) {
      errorMsg.textContent = "Username already taken.";
      return;
    }

    const email = usernameToEmail(username);

    // Create Firebase Auth user
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    // Store user in Firestore
    await setDoc(doc(db, "users", userCred.user.uid), {
      username: username,
      tokens: 100,
      createdAt: new Date()
    });

    // ✅ Success → go to lobby
    window.location.href = "lobby.html";

  } catch (error) {
    console.error(error);

    if (error.code === "auth/email-already-in-use") {
      errorMsg.textContent = "Username already exists.";
    } else {
      errorMsg.textContent = "Signup failed. Try again.";
    }
  }
});
