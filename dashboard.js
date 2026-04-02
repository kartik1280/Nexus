// ===================== AUTH GUARD =====================
// Check if user is logged in, redirect if not
const storedUser = JSON.parse(localStorage.getItem("user") || "null");
const profileCompleted = localStorage.getItem("profileCompleted");

if (!storedUser) {
  // Not logged in → go to login
  window.location.href = "login.html";
} else if (!profileCompleted || profileCompleted !== "true") {
  // Logged in but no profile → go to profile setup
  window.location.href = "profile_setup.html";
}

// ===================== POPULATE USER INFO =====================
const profileName = localStorage.getItem("profileName") || storedUser?.name || "User";
const firstName = profileName.split(" ")[0];

document.getElementById("userName").textContent = firstName;
document.getElementById("avatarInitial").textContent = firstName.charAt(0).toUpperCase();

// Welcome message based on time
const hour = new Date().getHours();
let greeting = "Ready to find your next dream team?";
if (hour < 12) greeting = "Good morning! Ready to find teammates?";
else if (hour < 17) greeting = "Good afternoon! Let's build something great.";
else greeting = "Good evening! Time to find your team.";
document.getElementById("welcomeSub").textContent = greeting;

// ===================== ANIMATED STAT COUNTERS =====================
function animateCounter(elementId, target, duration = 1200) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  let start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    
    el.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// Simulate stats (in a real app, fetch from backend)
setTimeout(() => {
  animateCounter("statMatches", 12);
  animateCounter("statLikes", 47);
  animateCounter("statStreak", 5);
  animateCounter("statEvents", 3);
}, 300);

// ===================== RECENT MATCHES =====================
const matchData = [
  { name: "Arjun Sharma", skills: "React, Node.js, AWS", score: "94%", gradient: "linear-gradient(135deg, #7c3aed, #a855f7)" },
  { name: "Priya Patel", skills: "Python, ML, TensorFlow", score: "91%", gradient: "linear-gradient(135deg, #ec4899, #f472b6)" },
  { name: "Rohan Mehta", skills: "UI/UX, Figma, CSS", score: "88%", gradient: "linear-gradient(135deg, #f97316, #fb923c)" },
  { name: "Sneha Reddy", skills: "Java, Spring Boot, Microservices", score: "85%", gradient: "linear-gradient(135deg, #10b981, #34d399)" },
  { name: "Vikram Singh", skills: "Flutter, Firebase, Dart", score: "82%", gradient: "linear-gradient(135deg, #eab308, #facc15)" },
];

function renderMatches() {
  const matchList = document.getElementById("matchList");
  if (!matchList) return;

  if (matchData.length === 0) {
    matchList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-user-group"></i>
        <h4>No matches yet</h4>
        <p>Start swiping to find teammates!</p>
      </div>
    `;
    return;
  }

  matchList.innerHTML = matchData.map((m, i) => `
    <div class="match-item" style="animation: fadeSlideUp 0.4s ease ${0.1 + i * 0.05}s backwards">
      <div class="match-avatar" style="background: ${m.gradient}">${m.name.charAt(0)}</div>
      <div class="match-info">
        <h4>${m.name}</h4>
        <p>${m.skills}</p>
      </div>
      <div class="match-score">${m.score}</div>
    </div>
  `).join("");
}

renderMatches();

// ===================== SKILLS CHART =====================
function renderSkills() {
  const skillsChart = document.getElementById("skillsChart");
  if (!skillsChart) return;

  // Try to get skills from localStorage or use defaults
  const storedSkills = localStorage.getItem("profileSkills");
  let skills;

  if (storedSkills) {
    const skillNames = storedSkills.split(",").map(s => s.trim()).filter(Boolean);
    skills = skillNames.map((name, i) => {
      const fills = ["fill-purple", "fill-pink", "fill-orange", "fill-green", "fill-yellow"];
      return { name, level: Math.floor(Math.random() * 40) + 60, fill: fills[i % fills.length] };
    });
  } else {
    skills = [
      { name: "React", level: 90, fill: "fill-purple" },
      { name: "Python", level: 78, fill: "fill-pink" },
      { name: "Node.js", level: 85, fill: "fill-orange" },
      { name: "UI/UX", level: 65, fill: "fill-green" },
      { name: "ML/AI", level: 55, fill: "fill-yellow" },
    ];
  }

  skillsChart.innerHTML = skills.map((s, i) => `
    <div class="skill-bar-row" style="animation: fadeSlideUp 0.4s ease ${0.3 + i * 0.08}s backwards">
      <span class="skill-bar-label">${s.name}</span>
      <div class="skill-bar-track">
        <div class="skill-bar-fill ${s.fill}" style="width: 0%" data-width="${s.level}%"></div>
      </div>
      <span class="skill-bar-value">${s.level}%</span>
    </div>
  `).join("");

  // Animate bars in
  setTimeout(() => {
    document.querySelectorAll(".skill-bar-fill").forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 400);
}

renderSkills();

// ===================== ACTIVITY FEED =====================
const activityData = [
  { text: "Matched with Arjun Sharma", time: "2 hours ago", dot: "dot-purple" },
  { text: "Liked Priya Patel's profile", time: "5 hours ago", dot: "dot-pink" },
  { text: "Joined AI Innovation Hackathon", time: "1 day ago", dot: "dot-green" },
  { text: "Updated your skills", time: "2 days ago", dot: "dot-orange" },
  { text: "Completed profile setup", time: "3 days ago", dot: "dot-purple" },
];

function renderActivity() {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  activityList.innerHTML = activityData.map(a => `
    <div class="activity-item">
      <div class="activity-dot ${a.dot}"></div>
      <div class="activity-content">
        <h4>${a.text}</h4>
        <p>${a.time}</p>
      </div>
    </div>
  `).join("");
}

renderActivity();

// ===================== LOGOUT =====================
document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("user");
  localStorage.removeItem("profileCompleted");
  localStorage.removeItem("profileName");
  showToast("Logged out successfully! 👋");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
});

// ===================== TOAST =====================
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ===================== EVENT BUTTON HANDLERS =====================
document.querySelectorAll(".event-card .btn-sm").forEach(btn => {
  btn.addEventListener("click", () => {
    const eventName = btn.closest(".event-card").querySelector("h4").textContent;
    showToast(`🎉 Action registered for "${eventName}"!`);
  });
});
