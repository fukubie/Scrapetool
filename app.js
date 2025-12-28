let images = [];
let index = 0;
let liked = [];

const img = document.getElementById("img");
const loadBtn = document.getElementById("loadBtn");
const input = document.getElementById("imageInput");

const yes = document.getElementById("yes");
const no = document.getElementById("nope");
const undo = document.getElementById("undo");

let startX = 0;

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
  if (!images[index]) {
    alert("Done!");
    return;
  }

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

  images = raw.split(/\s+/).filter(Boolean);
  index = 0;
  liked = [];
  show();
};

// ---------- SWIPE ----------
function swipe(direction) {
  if (!images[index]) return;

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

// ---------- TOUCH SUPPORT ----------
const card = document.getElementById("card");

card.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

card.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 80) swipe(dx > 0 ? "right" : "left");
});
