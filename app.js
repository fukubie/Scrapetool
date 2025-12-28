let images = [];
let index = 0;
let liked = [];
let userLimit = 0;

const img = document.getElementById("img");
img.referrerPolicy = "no-referrer";

const loadBtn = document.getElementById("loadBtn");
const input = document.getElementById("imageInput");
const limitInput = document.getElementById("limit");

const yes = document.getElementById("yes");
const no = document.getElementById("nope");
const undo = document.getElementById("undo");

const copyBtn = document.getElementById("copy");
const downloadBtn = document.getElementById("download");

const card = document.getElementById("card");
let startX = 0;

// Create counters dynamically
const counter = document.createElement("div");
counter.id = "counter";
card.appendChild(counter);

const likedCounter = document.createElement("div");
likedCounter.id = "likedCounter";
card.appendChild(likedCounter);

// ---------- LOAD IMAGE SAFELY ----------
async function loadImage(url) {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn("Skipped:", url);
    return null;
  }
}

// ---------- SHOW IMAGE ----------
async function show() {
  if (index >= userLimit || !images[index]) {
    img.src = "";
    counter.textContent = `Done! Reviewed ${index} images.`;
    likedCounter.textContent = `Liked: ${liked.length}`;
    return;
  }

  counter.textContent = `Image ${index + 1} / ${userLimit}`;
  likedCounter.textContent = `Liked: ${liked.length}`;

  const blobUrl = await loadImage(images[index]);
  if (!blobUrl) {
    index++;
    return show(); // skip broken image
  }

  img.src = blobUrl;
}

// ---------- LOAD BUTTON ----------
loadBtn.onclick = () => {
  const raw = input.value.trim();
  if (!raw) return alert("Paste image URLs first");

  let limit = parseInt(limitInput.value);
  if (isNaN(limit) || limit <= 0) {
    return alert("Please enter a positive number for the limit.");
  }

  images = raw.split(/\s+/).filter(Boolean);
  userLimit = Math.min(limit, images.length);
  index = 0;
  liked = [];
  show();
};

// ---------- SWIPE ----------
function swipe(direction) {
  if (index >= userLimit || !images[index]) return;

  if (direction === "right") liked.push(images[index]);

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

yes.onclick = () => swipe("right");
no.onclick = () => swipe("left");

// ---------- UNDO ----------
undo.onclick = () => {
  if (index === 0) return;
  index--;
  show();
};

// ---------- COPY / DOWNLOAD ----------
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

// ---------- TOUCH SUPPORT ----------
card.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

card.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 80) swipe(dx > 0 ? "right" : "left");
});
