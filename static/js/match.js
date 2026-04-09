const params = new URLSearchParams(window.location.search);
const hackathonId = params.get("hackathon");

if (!hackathonId) {
  alert("No hackathon selected!");
  window.location.href = "/dashboard";
}

const invitesList = document.getElementById("invitesList");
const teamContainer = document.getElementById("teamContainer");
const inviteBtn = document.getElementById("inviteBtn");
const hackathonSelect = document.getElementById("hackathonSelect");

const hackathonLinks = {
  "devweek_2026": "https://www.developerweek.com/hackathon/",
  "hack_for_humanity_2026": "https://hack-for-humanity-26.devpost.com/",
  "ghw_2026": "https://www.mlh.com/seasons/2026/events"
};

if (inviteBtn) inviteBtn.onclick = manualInvite;

// ================= LOAD =================
async function loadData() {
  if (!hackathonId) {
    alert("No hackathon selected!");
    return;
  }

  console.log("CURRENT HACKATHON:", hackathonId);

  // set dropdown
  if (hackathonSelect) {
    hackathonSelect.value = hackathonId;
  }

  try {
    // fetch invites
    const inviteRes = await fetch(`/api/invites?hackathon_id=${hackathonId}`, { cache: "no-store" });
    const inviteData = await inviteRes.json();
    renderInvites(inviteData.invites || []);

    // fetch team
    const teamRes = await fetch(`/api/my-team?hackathon_id=${hackathonId}`, { cache: "no-store" });
    const teamData = await teamRes.json();

    if (!teamData.team) {
      renderNoTeam();
    } else {
      renderTeam(teamData.team);
    }

  } catch (e) {
    console.error("Load error:", e);
  }
}

// ================= NO TEAM UI =================
function renderNoTeam() {
  if (!teamContainer) return;

  teamContainer.innerHTML = `
    <div class="no-team">
      <p>No team for this hackathon yet</p>
      <button class="btn primary" onclick="createTeamFromMatches()">
        Create Team
      </button>
      <button class="btn" onclick="goToSwipe()" style="margin-top:10px;">
        🔥 Start Swiping
      </button>
    </div>
  `;
}

// ================= CREATE TEAM =================
async function createTeamFromMatches() {
  try {
    const res = await fetch("/api/team/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hackathon_id: hackathonId })
    });

    const data = await res.json();

    if (data.status === "team_created") {
      alert("Team created 🚀");
    } else if (data.status === "already_in_team") {
      alert("You are already in a team ⚠️");
    }

    await loadData();

  } catch (e) {
    console.error("Create team error:", e);
  }
}

// ================= INVITES =================
function renderInvites(invites) {
  if (!invitesList) return;

  invitesList.innerHTML = "";

  if (!invites.length) {
    invitesList.innerHTML = "<p>No invites</p>";
    return;
  }

  invites.forEach(inv => {
    invitesList.innerHTML += `
      <div class="invite-card">
        <div class="invite-name">${inv.sender_name}</div>
        <div class="invite-meta">Hackathon: ${inv.hackathon_id}</div>

        <div class="invite-actions">
          <button class="accept" onclick="respond(${inv.invite_id}, 'accept')">Accept</button>
          <button class="reject" onclick="respond(${inv.invite_id}, 'reject')">Reject</button>
        </div>
      </div>
    `;
  });
}



// ================= TEAM =================
function renderTeam(team) {
  if (!teamContainer) return;

  if (!team || !team.members || team.members.length === 0) {
    renderNoTeam();
    return;
  }

  let link = hackathonLinks[hackathonId] || "#";

  let html = `
    <div style="margin-bottom:10px;">
      <a href="${link}" target="_blank" style="color:#a855f7;">
        🔗 Open Hackathon
      </a>
    </div>

    <table>
      <tr>
        <th>Name</th>
        <th>Role</th>
        <th>Skills</th>
      </tr>
  `;

  team.members.forEach(m => {
    html += `
      <tr>
        <td>${m.name}</td>
        <td>${m.role}</td>
        <td>${m.skills.join(", ")}</td>
      </tr>
    `;
  });

  html += `</table>`;

  html += `
    <button class="leave-btn" onclick="leaveTeam()" id="leaveBtn">
      Leave Team
    </button>

    <button class="btn primary" onclick="goToSwipe()" style="margin-top:10px;">
      🔥 Find Teammates
    </button>
  `;

  teamContainer.innerHTML = html;
}

// ================= LEAVE TEAM =================
async function respond(id, action) {
  try {
    const res = await fetch("/api/invite/respond", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        invite_id: id,
        action: action
      })
    });

    const data = await res.json();

    if (data.status === "done") {
      alert("Updated ✅");
    } else {
      alert("Error updating invite");
    }

  } catch (e) {
    console.error(e);
    alert("Network error");
  }

  await loadData();
}

// ================= MANUAL INVITE =================
async function manualInvite() {
  const input = document.getElementById("inviteInput");
  const val = input?.value.trim();

  if (!val) {
    alert("Enter a name or ID");
    return;
  }

  try {
    const res = await fetch("/api/invite/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: val,
        hackathon_id: hackathonId
      })
    });

    const data = await res.json();

    if (data.status === "sent") {
      alert("Invite sent 🚀");
    } else if (data.status === "already_sent") {
      alert("Already invited ⚠️");
    } else {
      alert(data.error || "Error sending invite");
    }

    input.value = "";

  } catch (e) {
    console.error("Manual invite error:", e);
  }
}


async function leaveTeam() {
  const hackathonId = new URLSearchParams(window.location.search).get("hackathon");

  if (!hackathonId) {
    alert("No hackathon selected");
    return;
  }

  const btn = document.getElementById("leaveBtn");
  if (btn) btn.disabled = true;

  try {
    const res = await fetch("/api/team/leave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        hackathon_id: hackathonId
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error leaving team");
      return;
    }

    if (data.status === "team_deleted") {
      alert("Team deleted 🗑️");
    } else if (data.status === "left") {
      alert("You left the team 👋");
    }

  } catch (e) {
    console.error("Leave error:", e);
    alert("Network error");
  }

  // ✅ VERY IMPORTANT: reload UI properly
  await loadData();
}


// ================= NAVIGATION =================
function switchHackathon() {
  const selected = hackathonSelect.value;
  window.location.href = `/matches?hackathon=${selected}`;
}

function goToSwipe() {
  window.location.href = `/swipe?hackathon=${hackathonId}`;
}

function goBackToDashboard() {
  window.location.href = "/dashboard";
}

// ================= START =================
loadData();