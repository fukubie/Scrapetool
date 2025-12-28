let images = [];
let index = 0;
let liked = [];

const img = document.getElementById("img");
const loadBtn = document.getElementById("loadBtn");
const input = document.getElementById("imageInput");

const yes = document.getElementById("yes");
const no = document.getElementById("nope");
const undo = document.getElementById("undo");

const copyBtn = document.getElementById("copy");
const downloadBtn = document.getElementById("download");

let startX = 0;
let currentX = 0;

// ---------------- LOAD IMAGES ----------------
loadBtn.onclick = () => {
  const raw = input.value.trim();
  if (!raw) return alert("Paste image URLs first.");

  images = raw
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  index = 0;
  liked = [];
  show();
};

// ---------------- SHOW IMAGE ----------------
function show() {
  if (!images[index]) {
    img.src = "";
    alert("Done!");
    return;
  }

  img.src = images[index];
  preloadNext();
}

// Preload next image
function preloadNext() {
  if (images[index + 1]) {
    const preload = new Image();
    preload.src = images[index + 1];
  }
}

// ---------------- SWIPE LOGIC ----------------
function swipe(direction) {
  if (!images[index]) return;

  if (direction === "right") {
    liked.push(images[index]);
  }

  img.style.transition = "0.3s";
  img.style.transform =
    direction === "right"
      ? "translateX(120vw) rotate(20deg)"
      : "translateX(-120vw) rotate(-20deg)";

  setTimeout(() => {
    index++;
    img.style.transition = "none";
    img.style.transform = "none";
    show();
  }, 300);
}

// Buttons
yes.onclick = () => swipe("right");
no.onclick = () => swipe("left");

// Undo
undo.onclick = () => {
  if (index === 0) return;
  index--;
  show();
};

// ---------------- COPY / DOWNLOAD ----------------
copyBtn.onclick = () => {
  navigator.clipboard.writeText(liked.join("\n"));
  alert("Copied!");
};

downloadBtn.onclick = () => {
  const blob = new Blob([liked.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "images.txt";
  a.click();
};

// ---------------- TOUCH SUPPORT ----------------
const card = document.getElementById("card");

card.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

card.addEventListener("touchmove", e => {
  currentX = e.touches[0].clientX;
  const dx = currentX - startX;
  card.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
});

card.addEventListener("touchend", () => {
  if (Math.abs(currentX - startX) > 80) {
    swipe(currentX > startX ? "right" : "left");
  } else {
    card.style.transition = "0.3s";
    card.style.transform = "translateX(0)";
    setTimeout(() => (card.style.transition = ""), 300);
  }
});
