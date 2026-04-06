// ===================== USER =====================
const profileName = userNameFromBackend || "User";
const firstName = profileName.split(" ")[0] || "User";

document.getElementById("userName").textContent = firstName;
document.getElementById("avatarInitial").textContent = firstName[0].toUpperCase();

// ===================== GREETING =====================
const hour = new Date().getHours();
let greeting = "Ready to build something awesome 🚀";

if (hour < 12) greeting = "Good morning ☀️";
else if (hour < 17) greeting = "Good afternoon 🌤️";
else greeting = "Good evening 🌙";

document.getElementById("welcomeSub").textContent = greeting;

// ===================== STATS =====================
function animate(id, target) {
  let el = document.getElementById(id);
  let current = 0;

  const step = Math.ceil(target / 30);

  let interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 30);
}

// TODO: Replace with backend later
animate("statMatches", 12);
animate("statLikes", 30);
animate("statStreak", 5);
animate("statEvents", 2);

// ===================== MATCHES =====================
const matches = [
  { name: "Arjun", skills: "React, Node", score: "94%" },
  { name: "Priya", skills: "ML, Python", score: "91%" }
];

const matchList = document.getElementById("matchList");

matchList.innerHTML = matches.map(m => `
  <div class="match-item">
    <div class="match-avatar">${m.name[0]}</div>
    <div class="match-info">
      <h4>${m.name}</h4>
      <p>${m.skills}</p>
    </div>
    <div class="match-score">${m.score}</div>
  </div>
`).join("");

// ===================== SKILLS =====================
const skillsChart = document.getElementById("skillsChart");

let skills = (Array.isArray(userSkills) && userSkills.length)
  ? userSkills
  : ["React", "Python"];

skillsChart.innerHTML = skills.map(s => {
  const percent = Math.floor(Math.random() * 30) + 60;

  return `
    <div class="skill-bar-row">
      <div class="skill-bar-label">${s}</div>
      <div class="skill-bar-track">
        <div class="skill-bar-fill fill-purple" style="width:${percent}%"></div>
      </div>
      <div class="skill-bar-value">${percent}%</div>
    </div>
  `;
}).join("");

// ===================== LOGOUT =====================
document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "/logout";
});