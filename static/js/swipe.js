let profiles = [];
let currentIndex = 0;
let matches = JSON.parse(localStorage.getItem("skillSwipeMatches")) || [];

const container = document.getElementById("cardContainer");
const toast = document.getElementById("toast");
const actions = document.getElementById("actions");

// ===================== DUMMY DATA =====================
const dummyProfiles = [
  {
    id: 1,
    name: "Aditya Mehta",
    skills: "React, Node.js, GraphQL",
    preferredRole: "Full Stack Developer",
    availability: "Weekends",
    year: "Year 3",
    pic: "/static/images/aditya.avif"
  },
  {
    id: 2,
    name: "Aryan Kulkarni",
    skills: "Python, Django, ML",
    preferredRole: "Backend Developer",
    availability: "Evenings",
    year: "Year 4",
    pic: "/static/images/aryan.avif"
  }
];

// ===================== LOAD =====================
function loadProfiles() {
  profiles = dummyProfiles;
  showProfile();
}

// ===================== RENDER =====================
function showProfile() {
  if (!container) return;

  if (currentIndex >= profiles.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="pulse-icon"><i class="fa-solid fa-users-slash"></i></div>
        <h3>No more profiles</h3>
        <p>Check back later 🚀</p>
      </div>`;
    if (actions) actions.style.display = "none";
    return;
  }

  if (actions) actions.style.display = "flex";

  const user = profiles[currentIndex];

  const skillSpans = user.skills.split(',').map(s => `<span>${s.trim()}</span>`).join('');

  container.innerHTML = `
    <div class="card" id="activeCard">
      <div class="profile-img-wrapper">
        <img src="${user.pic}" class="profile-img"
          onerror="this.src='/static/images/default.png'"/>
      </div>

      <div class="profile-info">
        <h2>${user.name} <span class="year-badge">${user.year}</span></h2>
        <div class="info-row"><i class="fa-solid fa-code"></i> ${user.preferredRole}</div>
        <div class="info-row"><i class="fa-regular fa-clock"></i> ${user.availability}</div>

        <div class="skills">${skillSpans}</div>
      </div>
    </div>
  `;

  enableDrag(document.getElementById("activeCard"));
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

    let currentX = getX(e);
    let dx = currentX - startX;
    let rotate = dx / 10;

    card.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;

    card.classList.toggle("preview-like", dx > 80);
    card.classList.toggle("preview-reject", dx < -80);
  }

  function end(e) {
    if (!isDragging) return;
    isDragging = false;

    let dx = getX(e) - startX;
    card.style.transition = "0.3s";

    if (dx > 120) swipe("right");
    else if (dx < -120) swipe("left");
    else {
      card.style.transform = "none";
      card.classList.remove("preview-like", "preview-reject");
    }
  }

  card.addEventListener("mousedown", start);
  card.addEventListener("mousemove", move);
  card.addEventListener("mouseup", end);

  card.addEventListener("touchstart", start);
  card.addEventListener("touchmove", move);
  card.addEventListener("touchend", end);
}

// ===================== SWIPE =====================
function swipe(direction) {
  const card = document.getElementById("activeCard");
  if (!card) return;

  const user = profiles[currentIndex];

  if (direction === "right") {
    showToast("Matched ❤️");

    if (!matches.find(m => m.id === user.id)) {
      matches.push(user);
      localStorage.setItem("skillSwipeMatches", JSON.stringify(matches));
    }

    card.style.transform = "translateX(500px) rotate(25deg)";
  } else {
    showToast("Skipped ❌");
    card.style.transform = "translateX(-500px) rotate(-25deg)";
  }

  card.style.opacity = "0";

  setTimeout(() => {
    currentIndex++;
    showProfile();
  }, 300);
}

// ===================== TOAST =====================
function showToast(msg) {
  toast.innerText = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1200);
}

window.swipe = swipe;

// ===================== INIT =====================
loadProfiles();