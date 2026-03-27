import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Elements
const playersDiv = document.getElementById("players");
const communityDiv = document.getElementById("community-cards");
const potDiv = document.getElementById("pot");
const leaveBtn = document.getElementById("leave-btn");

const foldBtn = document.getElementById("fold-btn");
const callBtn = document.getElementById("call-btn");
const raiseBtn = document.getElementById("raise-btn");

// Get room ID from URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room") || "global";

let currentUser = null;
let gameState = null;

// 🔐 Auth
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  await joinRoom();
  listenToGame();
});

// 🚪 Leave
leaveBtn.onclick = () => {
  window.location.href = "lobby.html";
};

// 🧍 Join room
async function joinRoom() {
  const roomRef = doc(db, "rooms", roomId);

  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) return;

  const data = roomSnap.data();

  const players = data.players || {};

  players[currentUser.uid] = {
    tokens: 100,
    folded: false
  };

  await updateDoc(roomRef, { players });
}

// 👂 Listen to game state
function listenToGame() {
  const roomRef = doc(db, "rooms", roomId);

  onSnapshot(roomRef, (docSnap) => {
    const data = docSnap.data();

    if (!data.gameState) {
      startGame();
    } else {
      gameState = data.gameState;
      render();
    }
  });
}

// 🃏 Start game
async function startGame() {
  const deck = createDeck();

  const roomRef = doc(db, "rooms", roomId);

  const newState = {
    deck,
    community: [],
    pot: 0,
    turn: 0,
    players: {}
  };

  await updateDoc(roomRef, { gameState: newState });
}

// 🃏 Deck
function createDeck() {
  const suits = ['H','D','C','S'];
  const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
  let deck = [];

  suits.forEach(s => ranks.forEach(r => deck.push(r+s)));

  return deck.sort(() => Math.random() - 0.5);
}

// 🎨 Render
function render() {
  playersDiv.innerHTML = "";
  communityDiv.innerHTML = "";

  // Players
  for (let id in gameState.players) {
    const p = gameState.players[id];
    const div = document.createElement("div");

    div.className = "player";
    div.textContent = id + " | Tokens: " + p.tokens;

    playersDiv.appendChild(div);
  }

  // Community cards
  gameState.community.forEach(card => {
    const img = document.createElement("img");
    img.src = `https://deckofcardsapi.com/static/img/${card}.png`;
    communityDiv.appendChild(img);
  });

  potDiv.textContent = "Pot: " + gameState.pot;
}

// 🎮 Actions (basic for now)
foldBtn.onclick = () => console.log("Fold");
callBtn.onclick = () => console.log("Call");
raiseBtn.onclick = () => console.log("Raise");
