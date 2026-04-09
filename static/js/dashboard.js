// ===================== USER =====================
const profileName = userNameFromBackend || "User";
const firstName = profileName.split(" ")[0] || "User";

const userNameEl = document.getElementById("userName");
const avatarEl = document.getElementById("avatarInitial");

if (userNameEl) userNameEl.textContent = firstName;
if (avatarEl) avatarEl.textContent = firstName[0].toUpperCase();

// ===================== GREETING =====================
const hour = new Date().getHours();
let greeting = "Ready to build something awesome 🚀";

if (hour < 12) greeting = "Good morning ☀️";
else if (hour < 17) greeting = "Good afternoon 🌤️";
else greeting = "Good evening 🌙";

const welcomeSub = document.getElementById("welcomeSub");
if (welcomeSub) welcomeSub.textContent = greeting;

// ===================== STATS =====================
function animate(id, target) {
  const el = document.getElementById(id);
  if (!el) return;

  let current = 0;
  const step = Math.ceil(target / 30);

  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 30);
}

async function loadStats() {
  try {
    const res = await fetch("/api/stats");
    const data = await res.json();

    animate("statMatches", data.matches || 0);
    animate("statLikes", data.likes || 0);
    animate("statStreak", data.team || 0);
    animate("statEvents", data.events || 0);
  } catch (e) {
    console.error("Stats error:", e);
  }
}

loadStats();

// ===================== MATCHES (DUMMY) =====================
const matchList = document.getElementById("matchList");

if (matchList) {
  const matches = [
    { name: "Arjun", skills: "React, Node", score: "94%" },
    { name: "Priya", skills: "ML, Python", score: "91%" }
  ];

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
}

// ===================== SKILLS =====================
const skillsChart = document.getElementById("skillsChart");

if (skillsChart) {
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
}

// ===================== LOGOUT =====================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/logout";
  });
}

// ===================== NAVIGATION =====================

// 🔥 Build Team → Swipe page
function startSwipe(hackathonId) {
  if (!hackathonId) {
    alert("Invalid hackathon");
    return;
  }

  window.location.href = `/swipe?hackathon=${hackathonId}`;
}

// 🔥 Create Team → Matches page
async function createTeamFromDashboard(hackathonId) {
  if (!hackathonId) {
    alert("Invalid hackathon");
    return;
  }

  try {
    const res = await fetch("/api/team/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ hackathon_id: hackathonId })
    });

    const data = await res.json();

    if (data.status === "team_created") {
      alert("Team created 🚀");
    } else if (data.status === "already_in_team") {
      alert("You are already in a team ⚠️");
    }

    // ✅ Always redirect to matches
    window.location.href = `/matches?hackathon=${hackathonId}`;

  } catch (e) {
    console.error("Create team error:", e);
    alert("Error creating team");
  }
}

// 🔥 View invites (hackathon specific)
function goToInvites(hackathonId) {
  if (!hackathonId) {
    alert("Select a hackathon first");
    return;
  }

  window.location.href = `/matches?hackathon=${hackathonId}`;
}