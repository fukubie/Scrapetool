let images = [];
let index = 0;
let liked = [];

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

let startX = 0;

// ---------- CARD COUNTER ----------
const card = document.getElementById("card");
card.style.position = "relative"; 

const counter = document.createElement("div");
counter.id = "counter";
counter.style.position = "absolute";
counter.style.bottom = "10px";
counter.style.left = "50%";
counter.style.transform = "translateX(-50%)";
counter.style.background = "rgba(0,0,0,0.6)";
counter.style.color = "#fff";
counter.style.padding = "4px 10px";
counter.style.borderRadius = "10px";
counter.style.fontSize = "14px";
counter.style.fontWeight = "bold";
card.appendChild(counter);

const likedCounter = document.createElement("div");
likedCounter.id = "likedCounter";
likedCounter.style.position = "absolute";
likedCounter.style.top = "10px";
likedCounter.style.right = "10px";
likedCounter.style.background = "rgba(255,0,0,0.7)";
likedCounter.style.color = "#fff";
likedCounter.style.padding = "4px 8px";
likedCounter.style.borderRadius = "10px";
likedCounter.style.fontSize = "14px";
likedCounter.style.fontWeight = "bold";
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
  // Skip broken images automatically
  while (index < images.length) {
    const blobUrl = await loadImage(images[index]);
    if (blobUrl) {
      img.src = blobUrl;
      counter.textContent = `Image ${index + 1} / ${images.length}`;
      likedCounter.textContent = `Liked: ${liked.length}`;
      return;
    } else {
      console.warn("Skipped broken image:", images[index]);
      index++;
    }
  }

  // All images reviewed
  img.src = "";
  counter.textContent = `Done! Reviewed ${index} images.`;
  likedCounter.textContent = `Liked: ${liked.length}`;
}

// ---------- LOAD BUTTON ----------
loadBtn.onclick = () => {
  const raw = input.value.trim();
  if (!raw) return alert("Paste image URLs first");

  let limit = parseInt(limitInput.value);
  if (isNaN(limit) || limit <= 0) return alert("Enter a positive limit.");

  const allImages = raw.split(/\s+/).filter(Boolean);
  if (limit > allImages.length) limit = allImages.length;
  images = allImages.slice(0, limit);

  index = 0;
  liked = [];
  show();
};

// ---------- SWIPE ----------
function swipe(direction) {
  if (index >= images.length) return;

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
  if (index > 0) {
    index--;
    // Remove from liked if it was liked
    const lastImage = images[index];
    const likedIndex = liked.indexOf(lastImage);
    if (likedIndex !== -1) liked.splice(likedIndex, 1);
    show();
  }
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
