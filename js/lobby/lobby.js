import { auth, db } from "../firebase/config.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elements
const roomsList = document.getElementById("rooms-list");
const createRoomBtn = document.getElementById("create-room-btn");
const roomNameInput = document.getElementById("room-name");
const logoutBtn = document.getElementById("logout-btn");

const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

let currentUser = null;
let currentRoom = "global";

// 🔐 Auth check
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUser = user;
    loadRooms();
    joinGlobalRoom();
    listenForChat();
  }
});

// 🚪 Logout
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// 🏠 Create default global room if needed
async function joinGlobalRoom() {
  const globalRef = doc(db, "rooms", "global");

  await setDoc(globalRef, {
    name: "Global Room",
    createdAt: new Date()
  }, { merge: true });
}

// 📦 Load rooms
async function loadRooms() {
  const snapshot = await getDocs(collection(db, "rooms"));

  roomsList.innerHTML = "";

  snapshot.forEach(docSnap => {
    const room = docSnap.data();
    const div = document.createElement("div");

    div.textContent = room.name;

    div.onclick = () => {
      window.location.href = `game.html?room=${docSnap.id}`;
    };

    roomsList.appendChild(div);
  });
}

// ➕ Create room
createRoomBtn.addEventListener("click", async () => {
  const name = roomNameInput.value.trim();

  if (!name) return;

  const docRef = await addDoc(collection(db, "rooms"), {
    name: name,
    createdAt: new Date()
  });

  window.location.href = `game.html?room=${docRef.id}`;
});

// 💬 Send message
sendBtn.addEventListener("click", async () => {
  const text = chatInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "rooms", currentRoom, "chat"), {
    sender: currentUser.uid,
    text: text,
    timestamp: new Date()
  });

  chatInput.value = "";
});

// 👂 Listen for chat
function listenForChat() {
  const chatRef = collection(db, "rooms", currentRoom, "chat");

  onSnapshot(chatRef, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach(doc => {
      const msg = doc.data();
      const div = document.createElement("div");

      div.textContent = msg.sender + ": " + msg.text;

      chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
