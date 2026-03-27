// /js/auth/login.js

import { auth } from "../firebase/config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Elements
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const errorMsg = document.getElementById("error-msg");

// Convert username → fake email
function usernameToEmail(username) {
  return username.toLowerCase() + "@poker.app";
}

// Login handler
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    errorMsg.textContent = "Please fill in all fields.";
    return;
  }

  const email = usernameToEmail(username);

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // ✅ Success → go to lobby
    window.location.href = "lobby.html";

  } catch (error) {
    console.error(error);

    // Friendly errors
    if (error.code === "auth/user-not-found") {
      errorMsg.textContent = "User not found.";
    } else if (error.code === "auth/wrong-password") {
      errorMsg.textContent = "Incorrect password.";
    } else {
      errorMsg.textContent = "Login failed. Try again.";
    }
  }
});
