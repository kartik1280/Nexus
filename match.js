const KEY = "skillSwipeMatches";

const grid = document.getElementById("matchesGrid");
const emptyText = document.getElementById("emptyText");
const countText = document.getElementById("countText");
const clearBtn = document.getElementById("clearBtn");
const teamBtn = document.getElementById("teamBtn");

/* ---------- helpers ---------- */
function loadMatches() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function saveMatches(matches) {
  localStorage.setItem(KEY, JSON.stringify(matches));
}
function yearNumber(yearText = "") {
  // "2nd Year" -> 2, "1st Year" -> 1 etc.
  const m = String(yearText).match(/\d+/);
  return m ? Number(m[0]) : null;
}
function jaccard(a = [], b = []) {
  const A = new Set(a.map(s => String(s).toLowerCase().trim()));
  const B = new Set(b.map(s => String(s).toLowerCase().trim()));
  const inter = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size || 1;
  return inter / union; // 0..1
}
function hash01(str = "") {
  // stable number 0..1 based on name (so score stays same each refresh)
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/* ---------- compatibility score ---------- */
/*
  score = 0..100
  - skills overlap (up to 70)
  - same course bonus (up to 15)
  - year closeness bonus (up to 10)
  - stable randomness (up to 5)
*/
function compatibilityScore(me, other) {
  const skillPart = jaccard(me.skills || [], other.skills || []) * 70;

  const coursePart =
    (me.course && other.course && me.course.toLowerCase() === other.course.toLowerCase())
      ? 15
      : 0;

  const y1 = yearNumber(me.year);
  const y2 = yearNumber(other.year);
  let yearPart = 0;
  if (y1 != null && y2 != null) {
    const diff = Math.abs(y1 - y2);
    // diff 0 => 10, diff 1 => 7, diff 2 => 4, else 2
    yearPart = diff === 0 ? 10 : diff === 1 ? 7 : diff === 2 ? 4 : 2;
  }

  const randPart = hash01(other.name || "") * 5;

  const raw = skillPart + coursePart + yearPart + randPart;

  // clamp to 35..98 so it feels realistic
  const clamped = Math.max(35, Math.min(98, Math.round(raw)));
  return clamped;
}

/* ---------- render ---------- */
function render() {
  const matches = loadMatches();
  grid.innerHTML = "";

  countText.textContent = `${matches.length} match${matches.length === 1 ? "" : "es"}`;
  emptyText.style.display = matches.length ? "none" : "block";

  // "me" profile can come from localStorage later.
  // For now: compute relative to an average profile (or first match if you prefer).
  const me = JSON.parse(localStorage.getItem("teamup_me") || "null") || {
    skills: ["Python", "React", "SQL"], // default baseline
    course: "",
    year: ""
  };

  matches.forEach((p, idx) => {
    // skills from swipe.js is a comma separated string, handle it
    const arrSkills = (typeof p.skills === "string") ? p.skills.split(",").map(s => s.trim()) : (p.skills || []);

    const score = compatibilityScore(me, { ...p, skills: arrSkills });

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="score-badge">
        <div class="pct">${score}%</div>
        <div class="lbl">Compatible</div>
      </div>

      <div class="row">
        <img class="pic" src="${p.pic}" alt="${p.name}">
        <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div class="name">${p.name}</div>
            <div class="meta">${p.preferredRole || ""}${p.year ? " • " + p.year : ""}</div>
          </div>
          <button class="btn-see-profile" data-i="${idx}" data-act="profile">See Profile</button>
        </div>
      </div>

      <div class="exp"><strong>Interests:</strong> ${p.interests || "—"}</div>

      <div class="meter"><span style="width:${score}%;"></span></div>

      <div class="skills">
        ${arrSkills.map(s => `<span class="skill">${s}</span>`).join("")}
      </div>

      <div class="card-actions">
        <button class="small msg" data-i="${idx}" data-act="msg">Message</button>
        <button class="small invite" data-i="${idx}" data-act="invite">Invite</button>
      </div>
    `;

    grid.appendChild(card);
  });
}

grid.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const matches = loadMatches();
  const i = Number(btn.dataset.i);
  const act = btn.dataset.act;
  const p = matches[i];
  if (!p) return;

  if (act === "msg") window.location.href = "personal_chat.html?chatwith=" + encodeURIComponent(p.name);
  if (act === "invite") alert(`(Demo) Invitation sent to ${p.name} ✅`);
  if (act === "profile") window.location.href = "dashboard.html?user=" + encodeURIComponent(p.name);
});

clearBtn.addEventListener("click", () => {
  saveMatches([]);
  render();
});

teamBtn.addEventListener("click", () => {
  const matches = loadMatches();
  if (matches.length < 2) {
    alert("You need at least 2 matches to create a team.");
    return;
  }
  alert(`(Demo) Team created with ${Math.min(4, matches.length)} members 🎉`);
});

render();
