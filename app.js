let images = [];
let index = 0;
let liked = [];
/** Stack of indices we've left (for undo). */
let displayHistory = [];
/** Index currently shown (for correct undo target). */
let currentDisplayedIndex = -1;
/** Current blob URL to revoke when changing image. */
let currentBlobUrl = null;

const img = document.getElementById("img");
const card = document.getElementById("card");
img.referrerPolicy = "no-referrer";
img.crossOrigin = "anonymous";

const loadBtn = document.getElementById("loadBtn");
const input = document.getElementById("imageInput");
const limitInput = document.getElementById("limit");

const yes = document.getElementById("yes");
const no = document.getElementById("nope");
const undo = document.getElementById("undo");

const copyBtn = document.getElementById("copy");
const downloadBtn = document.getElementById("download");

let startX = 0;
let dragOffset = 0;

// ---------- CARD COUNTER ----------
card.style.position = "relative";

const counter = document.createElement("div");
counter.id = "counter";
counter.className = "card-badge counter-badge";
card.appendChild(counter);

const likedCounter = document.createElement("div");
likedCounter.id = "likedCounter";
likedCounter.className = "card-badge liked-badge";
card.appendChild(likedCounter);

// ---------- REVOKE PREVIOUS BLOB ----------
function revokeCurrentBlob() {
  if (currentBlobUrl && currentBlobUrl.startsWith("blob:")) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
}

// ---------- LOAD IMAGE: try blob first, then direct URL ----------
function loadImageAsBlob(url) {
  return fetch(url, { mode: "cors", referrerPolicy: "no-referrer" })
    .then((res) => (res.ok ? res.blob() : Promise.reject(new Error("Not ok"))))
    .then((blob) => URL.createObjectURL(blob));
}

function loadImageDirect(url) {
  return new Promise((resolve, reject) => {
    const testImg = new Image();
    testImg.referrerPolicy = "no-referrer";
    testImg.crossOrigin = "anonymous";
    testImg.onload = () => resolve(url);
    testImg.onerror = () => reject(new Error("Load failed"));
    testImg.src = url;
  });
}

async function loadImage(url) {
  try {
    const blobUrl = await loadImageAsBlob(url);
    return { url: blobUrl, isBlob: true };
  } catch (e) {
    try {
      await loadImageDirect(url);
      return { url, isBlob: false };
    } catch (e2) {
      return null;
    }
  }
}

// ---------- SHOW IMAGE ----------
function setImageSrc(result) {
  revokeCurrentBlob();
  if (result.isBlob) currentBlobUrl = result.url;
  img.src = result.url;
  img.dataset.loaded = "true";
}

function setDoneState() {
  revokeCurrentBlob();
  img.removeAttribute("src");
  img.dataset.loaded = "";
  counter.textContent = "Done!";
  likedCounter.textContent = `Liked: ${liked.length}`;
}

async function show(optionalIndex) {
  if (optionalIndex !== undefined) {
    index = optionalIndex;
  }

  while (index < images.length) {
    const result = await loadImage(images[index]);
    if (result) {
      setImageSrc(result);
      currentDisplayedIndex = index;
      counter.textContent = `Image ${index + 1} / ${images.length}`;
      likedCounter.textContent = `Liked: ${liked.length}`;
      return;
    }
    index++;
  }

  currentDisplayedIndex = -1;
  setDoneState();
}

// ---------- LOAD BUTTON ----------
loadBtn.onclick = () => {
  const raw = input.value.trim();
  if (!raw) return alert("Paste image URLs first");

  let limit = parseInt(limitInput.value, 10);
  if (isNaN(limit) || limit <= 0) return alert("Enter a positive limit.");

  const allImages = raw.split(/\s+/).filter(Boolean);
  if (limit > allImages.length) limit = allImages.length;
  images = allImages.slice(0, limit);

  index = 0;
  liked = [];
  displayHistory = [];
  currentDisplayedIndex = -1;
  revokeCurrentBlob();
  card.classList.remove("swipe-left", "swipe-right");
  show();
};

// ---------- SWIPE ----------
function swipe(direction) {
  if (index >= images.length || currentDisplayedIndex < 0) return;

  if (direction === "right") liked.push(images[currentDisplayedIndex]);

  displayHistory.push(currentDisplayedIndex);

  card.classList.remove("swipe-left", "swipe-right");
  card.classList.add(direction === "right" ? "swipe-right" : "swipe-left");
  card.style.transform =
    direction === "right"
      ? "translateX(120vw) rotate(12deg)"
      : "translateX(-120vw) rotate(-12deg)";

  setTimeout(() => {
    index++;
    card.style.transition = "none";
    card.style.transform = "none";
    setTimeout(() => {
      card.style.transition = "";
      show();
    }, 50);
  }, 280);
}

yes.onclick = () => swipe("right");
no.onclick = () => swipe("left");

// ---------- UNDO ----------
undo.onclick = async () => {
  while (displayHistory.length > 0) {
    const targetIndex = displayHistory.pop();
    const wasLiked = liked.indexOf(images[targetIndex]) !== -1;
    if (wasLiked) liked.splice(liked.indexOf(images[targetIndex]), 1);
    index = targetIndex;
    const result = await loadImage(images[index]);
    if (result) {
      setImageSrc(result);
      currentDisplayedIndex = index;
      counter.textContent = `Image ${index + 1} / ${images.length}`;
      likedCounter.textContent = `Liked: ${liked.length}`;
      return;
    }
  }
};

// ---------- KEYBOARD: Arrow Left = nope, Arrow Right = like ----------
document.addEventListener("keydown", (e) => {
  if (e.target.closest("textarea") || e.target.closest("input")) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    no.click();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    yes.click();
  }
});

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
  URL.revokeObjectURL(a.href);
};

// ---------- TOUCH / MOUSE DRAG (Tinder-style) ----------
card.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
  card.style.transition = "none";
});

card.addEventListener("touchmove", (e) => {
  dragOffset = e.touches[0].clientX - startX;
  card.style.transform = `translateX(${dragOffset}px) rotate(${dragOffset * 0.03}deg)`;
  card.classList.toggle("drag-left", dragOffset < -30);
  card.classList.toggle("drag-right", dragOffset > 30);
});

card.addEventListener("touchend", () => {
  card.style.transition = "";
  card.style.transform = "";
  card.classList.remove("drag-left", "drag-right");
  if (Math.abs(dragOffset) > 80) swipe(dragOffset > 0 ? "right" : "left");
  dragOffset = 0;
});

card.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  startX = e.clientX;
  card.style.transition = "none";
  const move = (e2) => {
    dragOffset = e2.clientX - startX;
    card.style.transform = `translateX(${dragOffset}px) rotate(${dragOffset * 0.03}deg)`;
    card.classList.toggle("drag-left", dragOffset < -30);
    card.classList.toggle("drag-right", dragOffset > 30);
  };
  const up = () => {
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
    card.style.transition = "";
    card.style.transform = "";
    card.classList.remove("drag-left", "drag-right");
    if (Math.abs(dragOffset) > 80) swipe(dragOffset > 0 ? "right" : "left");
    dragOffset = 0;
  };
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
});
