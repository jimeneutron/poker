// /js/game/game.js

import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
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

// Room ID from URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("room") || "global";

let currentUser = null;
let gameState = null;

// 🔐 Auth check
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

// 🧍 Join room safely
async function joinRoom() {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) return;

  const data = roomSnap.data();
  const players = data.players || {};

  if (!players[currentUser.uid]) {
    players[currentUser.uid] = {
      tokens: 100
    };

    await updateDoc(roomRef, { players });
  }
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

// 🃏 Start game + deal cards
async function startGame() {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  const roomData = roomSnap.data();
  const playerIds = Object.keys(roomData.players || {});

  if (playerIds.length === 0) return;

  let deck = createDeck();

  const players = {};

  // Deal 2 cards to each player
  playerIds.forEach(id => {
    players[id] = {
      hand: [deck.pop(), deck.pop()],
      tokens: roomData.players[id].tokens || 100,
      folded: false,
      currentBet: 0
    };
  });

  const newState = {
    deck,
    community: [],
    pot: 0,
    turn: 0,
    phase: "preflop",
    players
  };

  await updateDoc(roomRef, { gameState: newState });
}

// 🃏 Create + shuffle deck
function createDeck() {
  const suits = ['H','D','C','S'];
  const ranks = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
  let deck = [];

  suits.forEach(s => ranks.forEach(r => deck.push(r+s)));

  return deck.sort(() => Math.random() - 0.5);
}

// 🎨 Render UI
function render() {
  playersDiv.innerHTML = "";
  communityDiv.innerHTML = "";

  for (let id in gameState.players) {
    const p = gameState.players[id];
    const div = document.createElement("div");
    div.className = "player";

    const isMe = id === currentUser.uid;

    div.innerHTML = `
      <div><strong>${isMe ? "You" : id}</strong></div>
      <div>Tokens: ${p.tokens}</div>
      <div class="hand"></div>
    `;

    const handDiv = div.querySelector(".hand");

    if (isMe) {
      // Show your cards
      p.hand.forEach(card => {
        const img = document.createElement("img");
        img.src = `https://deckofcardsapi.com/static/img/${card}.png`;
        img.style.width = "40px";
        handDiv.appendChild(img);
      });
    } else {
      // Hide others' cards
      for (let i = 0; i < 2; i++) {
        const back = document.createElement("div");
        back.textContent = "🂠";
        handDiv.appendChild(back);
      }
    }

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

// 🎮 Actions (placeholder)
foldBtn.onclick = () => console.log("Fold");
callBtn.onclick = () => console.log("Call");
raiseBtn.onclick = () => console.log("Raise");
