// ===================== INIT =====================
const hackathonId = new URLSearchParams(window.location.search).get("hackathon");

if (!hackathonId) {
  alert("No hackathon selected! Redirecting...");
  window.location.href = "/dashboard";
}

let profiles = [];
let currentIndex = 0;

const container = document.getElementById("cardContainer");
const toast = document.getElementById("toast");
const actions = document.getElementById("actions");

// ===================== LOAD =====================
async function loadProfiles() {
  if (!container) return;

  container.innerHTML = `<p>Loading profiles...</p>`;

  try {
    const res = await fetch("/api/profiles");
    const data = await res.json();

    profiles = data.profiles || [];
    currentIndex = 0;

    showProfile();

  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Failed to load profiles</p>`;
    showToast("Failed to load profiles");
  }
}

// ===================== RENDER =====================
function showProfile() {
  if (!container) return;

  if (!profiles.length || currentIndex >= profiles.length) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No more profiles</h3>
        <p>Check back later 🚀</p>
      </div>`;

    if (actions) actions.style.display = "none";
    return;
  }

  if (actions) actions.style.display = "flex";

  const user = profiles[currentIndex];

  const skillSpans = (user.skills || "")
    .split(',')
    .map(s => `<span>${s.trim()}</span>`)
    .join('');

  container.innerHTML = `
    <div class="card" id="activeCard">
      <div class="profile-info">
        <h2>${user.name}</h2>
        <div>${user.preferredRole}</div>
        <div>${user.availability}</div>
        <div class="skills">${skillSpans}</div>
        ${user.github
      ? `
    <div class="github-wrapper">
      <a href="${user.github}" target="_blank" class="github-btn">
        <i class="fab fa-github"></i>
        View GitHub
      </a>
    </div>
    `
      : ""
    }
      </div>
    </div>
  `;

  enableDrag(document.getElementById("activeCard"));
}

// ===================== SWIPE =====================
async function swipe(direction) {
  const card = document.getElementById("activeCard");
  if (!card) return;

  const user = profiles[currentIndex];

  if (direction === "right") {
    showToast("Sending invite... 🚀");

    try {
      const res = await fetch("/api/swipe/right", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          target_user_id: user.id,
          hackathon_id: hackathonId
        })
      });

      const data = await res.json();

      if (data.status === "invite_sent") {
        showToast("Invite sent 💌");
      } else if (data.status === "already_sent") {
        showToast("Already invited ⚠️");
      } else {
        showToast("Error sending invite");
      }

    } catch (err) {
      console.error(err);
      showToast("Network error");
    }

    card.style.transform = "translateX(500px)";
  } else {
    showToast("Skipped ❌");
    card.style.transform = "translateX(-500px)";
  }

  card.style.opacity = "0";

  setTimeout(() => {
    currentIndex++;
    showProfile();
  }, 300);
}

// ===================== DRAG =====================
function enableDrag(card) {
  if (!card) return;

  let startX = 0;
  let isDragging = false;

  const getX = e => e.touches ? e.touches[0].clientX : e.clientX;

  function start(e) {
    isDragging = true;
    startX = getX(e);
    card.style.transition = "none";
  }

  function move(e) {
    if (!isDragging) return;

    let dx = getX(e) - startX;
    card.style.transform = `translateX(${dx}px)`;
  }

  function end(e) {
    if (!isDragging) return;
    isDragging = false;

    let dx = getX(e) - startX;
    card.style.transition = "0.3s";

    if (dx > 120) swipe("right");
    else if (dx < -120) swipe("left");
    else card.style.transform = "none";
  }

  // mouse
  card.addEventListener("mousedown", start);
  card.addEventListener("mousemove", move);
  card.addEventListener("mouseup", end);

  // touch
  card.addEventListener("touchstart", start);
  card.addEventListener("touchmove", move);
  card.addEventListener("touchend", end);
}

// ===================== TOAST =====================
function showToast(msg) {
  if (!toast) return;

  toast.innerText = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1200);
}

// ===================== GLOBAL BUTTON SUPPORT =====================
window.swipe = swipe;

// ===================== NAVIGATION =====================

// ===================== INIT =====================
loadProfiles();


function goToDashboard() {
  document.body.style.opacity = "0.5";
  setTimeout(() => {
    window.location.href = "/dashboard";
  }, 150);
}

function goToMatches() {
  document.body.style.opacity = "0.5";
  setTimeout(() => {
    window.location.href = `/matches?hackathon=${hackathonId}`;
  }, 150);
}