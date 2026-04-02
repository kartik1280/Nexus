let profiles = [];
let currentIndex = 0;
let matches = JSON.parse(localStorage.getItem("skillSwipeMatches")) || [];

const dummyProfiles = [
  {
    id: 1,
    name: "Aditya Mehta",
    skills: "React, Node.js, GraphQL",
    interests: "Open Source, Hackathons",
    preferredRole: "Full Stack Developer",
    availability: "Weekends",
    year: "Year 3",
    pic: "Profiles/aditya.avif"
  },
  {
    id: 2,
    name: "Aryan Kulkarni",
    skills: "Python, Django, ML",
    interests: "AI Research",
    preferredRole: "Backend Developer",
    availability: "Evenings",
    year: "Year 4",
    pic: "Profiles/aryan.avif"
  },
  {
    id: 3,
    name: "Kabir Sharma",
    skills: "C++, Systems, Architecture",
    interests: "Algorithms, High Performance",
    preferredRole: "Software Engineer",
    availability: "Flexible",
    year: "Year 3",
    pic: "Profiles/kabir.avif"
  },
  {
    id: 4,
    name: "Riya Sethi",
    skills: "Figma, UI/UX, CSS",
    interests: "Design Systems",
    preferredRole: "UI/UX Designer",
    availability: "Flexible",
    year: "Year 2",
    pic: "Profiles/riya.avif"
  },
  {
    id: 5,
    name: "Sneha Gupta",
    skills: "Java, MySQL, Spring",
    interests: "Cloud Architectures",
    preferredRole: "Backend Developer",
    availability: "Full-time",
    year: "Year 3",
    pic: "Profiles/sneha.avif"
  }
];

const container = document.getElementById("cardContainer");
const toast = document.getElementById("toast");

let startX = 0;
let currentX = 0;
let isDragging = false;
let activeCard = null;

function loadProfiles() {
  profiles = dummyProfiles;
  showProfile();
}

function showProfile() {
  if (currentIndex >= profiles.length) {
    container.innerHTML = `
      <div class="empty-state">
          <div class="pulse-icon"><i class="fa-solid fa-users-slash"></i></div>
          <h3>No more profiles</h3>
          <p>You've swiped through everyone in your area.</p>
          <button class="btn-refresh" onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; border-radius: 12px; background: linear-gradient(135deg, #a855f7, #ec4899); border: none; color: white; cursor: pointer; font-weight: 600; font-size: 15px;">Check Again</button>
      </div>`;
    document.querySelector('.actions').style.display = 'none';
    return;
  }

  document.querySelector('.actions').style.display = 'flex';
  const user = profiles[currentIndex];

  const skillSpans = user.skills.split(',').map(s => `<span>${s.trim()}</span>`).join('');

  container.innerHTML = `
    <div class="card" id="activeCard">
      <div class="profile-img-wrapper">
          <div class="profile-img-bg" style="background-image: url('${user.pic}')"></div>
          <img src="${user.pic}" class="profile-img" />
          <div class="img-overlay"></div>
      </div>
      <div class="profile-info">
          <h2>${user.name} <span class="year-badge">${user.year}</span></h2>
          <div class="info-row"><i class="fa-solid fa-code"></i> ${user.preferredRole}</div>
          <div class="info-row"><i class="fa-regular fa-clock"></i> ${user.availability}</div>
          <div class="info-row"><i class="fa-solid fa-star"></i> ${user.interests}</div>
          <div class="skills">
              ${skillSpans}
          </div>
      </div>
    </div>
  `;

  activeCard = document.getElementById("activeCard");
  addDragEvents();
}

function addDragEvents() {
  if (!activeCard) return;

  activeCard.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", endDrag);

  activeCard.addEventListener("touchstart", startDrag, { passive: true });
  document.addEventListener("touchmove", onDrag, { passive: true });
  document.addEventListener("touchend", endDrag);
}

function getClientX(e) {
  if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
  if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
  return e.clientX;
}

function startDrag(e) {
  if (!activeCard) return;
  isDragging = true;
  startX = getClientX(e);
  activeCard.style.transition = "none";
}

function onDrag(e) {
  if (!isDragging || !activeCard) return;

  currentX = getClientX(e);
  const moveX = currentX - startX;
  const rotate = moveX / 12;

  activeCard.style.transform = `translateX(${moveX}px) rotate(${rotate}deg)`;

  if (moveX > 50) {
    activeCard.classList.add("preview-like");
    activeCard.classList.remove("preview-reject");
  } else if (moveX < -50) {
    activeCard.classList.add("preview-reject");
    activeCard.classList.remove("preview-like");
  } else {
    activeCard.classList.remove("preview-like", "preview-reject");
  }
}

function endDrag(e) {
  if (!isDragging || !activeCard) return;

  isDragging = false;
  currentX = getClientX(e);
  const moveX = currentX - startX;

  activeCard.style.transition = "transform 0.35s ease, opacity 0.35s ease";

  if (moveX > 120) {
    swipe("right");
  } else if (moveX < -120) {
    swipe("left");
  } else {
    activeCard.style.transform = "translateX(0) rotate(0deg)";
    activeCard.classList.remove("preview-like", "preview-reject");
  }
}

function swipe(direction) {
  if (!activeCard) return;

  const user = profiles[currentIndex];

  if (direction === "right") {
    activeCard.style.transform = "translateX(450px) rotate(20deg)";
    activeCard.style.opacity = "0";
    showToast("Matched ❤️");

    // Save match
    const isAlreadyMatched = matches.find(m => m.id === user.id);
    if (!isAlreadyMatched) {
      matches.push(user);
      localStorage.setItem("skillSwipeMatches", JSON.stringify(matches));
    }

  } else {
    activeCard.style.transform = "translateX(-450px) rotate(-20deg)";
    activeCard.style.opacity = "0";
    showToast("Skipped ❌");
  }

  setTimeout(() => {
    currentIndex++;
    showProfile();
  }, 350);
}

function showToast(msg) {
  toast.innerText = msg;
  toast.style.display = "block";
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(-10px)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%)";
  }, 1200);
}

window.swipe = swipe;

loadProfiles();