/* ================================================================
   CodeMate AI – Real-Time Group Chat  (Firebase Realtime Database)
   ================================================================
   HOW TO SET UP:
   1. Go to https://console.firebase.google.com
   2. Create a new project (or use an existing one)
   3. Enable "Realtime Database" (NOT Firestore) in Build → Realtime Database
   4. Set rules to allow authenticated reads/writes (or open for testing):
        {
          "rules": {
            ".read": true,
            ".write": true
          }
        }
   5. Go to Project Settings → General → Your apps → Add web app
   6. Copy your config object and paste it below
   ================================================================ */

// ────────────────  FIREBASE CONFIG  ────────────────
// ⚠️ REPLACE THIS with your own Firebase project config
const firebaseConfig = {
    apiKey:            "YOUR_API_KEY",
    authDomain:        "YOUR_PROJECT.firebaseapp.com",
    databaseURL:       "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId:         "YOUR_PROJECT",
    storageBucket:     "YOUR_PROJECT.appspot.com",
    messagingSenderId: "000000000000",
    appId:             "1:000000000000:web:0000000000000000"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ────────────────  STATE  ────────────────
let currentUser  = null;  // { uid, displayName, color }
let currentRoom  = null;  // room key string
let messageLimit = 100;
let listeners    = {};    // active Firebase listeners
let lastAuthor   = '';    // for grouping consecutive messages

// Predefined avatar colours (used per-user)
const AVATAR_COLORS = [
    '#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c',
    '#3498db','#9b59b6','#e84393','#6366f1','#00b4d8',
    '#10b981','#8b5cf6','#ef4444','#f59e0b','#06b6d4'
];

// ────────────────  DOM REFS  ────────────────
const nameModal       = document.getElementById('nameModal');
const nameInput       = document.getElementById('nameInput');
const joinBtn         = document.getElementById('joinBtn');
const roomModal       = document.getElementById('roomModal');
const roomNameInput   = document.getElementById('roomNameInput');
const createRoomBtn   = document.getElementById('createRoomBtn');
const confirmRoomBtn  = document.getElementById('confirmRoomBtn');
const cancelRoomBtn   = document.getElementById('cancelRoomBtn');
const sidebar         = document.getElementById('sidebar');
const sidebarOpen     = document.getElementById('sidebarOpen');
const sidebarClose    = document.getElementById('sidebarClose');
const roomListEl      = document.getElementById('roomList');
const searchRooms     = document.getElementById('searchRooms');
const roomTitle       = document.getElementById('roomTitle');
const memberNum       = document.getElementById('memberNum');
const messagesInner   = document.getElementById('messagesInner');
const messageInput    = document.getElementById('messageInput');
const sendBtn         = document.getElementById('sendBtn');
const scrollBottomBtn = document.getElementById('scrollBottomBtn');
const membersPanel    = document.getElementById('membersPanel');
const membersList     = document.getElementById('membersList');
const membersBtn      = document.getElementById('membersBtn');
const closeMembersBtn = document.getElementById('closeMembersBtn');
const typingIndicator = document.getElementById('typingIndicator');
const typingText      = document.getElementById('typingText');
const displayNameEl   = document.getElementById('displayName');
const msgContainer    = document.getElementById('messagesContainer');
const welcomeMsg      = document.getElementById('welcomeMsg');

// ────────────────  UTILITIES  ────────────────
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function pickColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeStr(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dateLabel(ts) {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ────────────────  NAME MODAL  ────────────────
function showNameModal() {
    nameModal.classList.remove('hidden');
    nameInput.value = localStorage.getItem('cm_name') || '';
    nameInput.focus();
}

joinBtn.addEventListener('click', joinChat);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') joinChat(); });

function joinChat() {
    const name = nameInput.value.trim();
    if (!name) { nameInput.style.borderColor = '#ef4444'; return; }

    // Create / restore user
    let storedUid = localStorage.getItem('cm_uid');
    if (!storedUid) { storedUid = uid(); localStorage.setItem('cm_uid', storedUid); }
    localStorage.setItem('cm_name', name);

    currentUser = {
        uid: storedUid,
        displayName: name,
        color: pickColor(name)
    };

    displayNameEl.textContent = name;
    nameModal.classList.add('hidden');

    // Set online presence
    const userRef = db.ref(`presence/${currentUser.uid}`);
    userRef.set({ name: currentUser.displayName, color: currentUser.color, online: true, lastSeen: Date.now() });
    userRef.onDisconnect().update({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });

    // Bootstrap default rooms & listen
    ensureDefaultRooms().then(() => {
        listenRooms();
        // Auto-join 'General Chat'
        switchRoom('general');
    });
}

// ────────────────  DEFAULT ROOMS  ────────────────
async function ensureDefaultRooms() {
    const snap = await db.ref('rooms/general').once('value');
    if (!snap.exists()) {
        await db.ref('rooms/general').set({
            name: 'General Chat',
            createdAt: Date.now(),
            createdBy: currentUser.uid
        });
    }
}

// ────────────────  ROOM LIST  ────────────────
function listenRooms() {
    db.ref('rooms').on('value', snap => {
        renderRoomList(snap.val() || {});
    });
}

function renderRoomList(rooms) {
    // Keep section title
    const titleEl = roomListEl.querySelector('.room-section-title');
    roomListEl.innerHTML = '';
    roomListEl.appendChild(titleEl);

    Object.entries(rooms).forEach(([key, room]) => {
        const el = document.createElement('div');
        el.className = 'room-item' + (key === currentRoom ? ' active' : '');
        el.innerHTML = `
            <div class="room-icon"><i class="fa-solid fa-hashtag"></i></div>
            <div class="room-details">
                <div class="room-name">${escapeHtml(room.name)}</div>
            </div>`;
        el.addEventListener('click', () => switchRoom(key));
        roomListEl.appendChild(el);
    });
}

// Filter rooms
searchRooms.addEventListener('input', () => {
    const q = searchRooms.value.toLowerCase();
    roomListEl.querySelectorAll('.room-item').forEach(el => {
        const name = el.querySelector('.room-name').textContent.toLowerCase();
        el.style.display = name.includes(q) ? '' : 'none';
    });
});

// ────────────────  SWITCH ROOM  ────────────────
function switchRoom(roomKey) {
    // Clean up previous listeners
    if (currentRoom) {
        if (listeners.messages) db.ref(`messages/${currentRoom}`).off('child_added', listeners.messages);
        if (listeners.typing)   db.ref(`typing/${currentRoom}`).off('value', listeners.typing);
        if (listeners.members)  db.ref(`roomMembers/${currentRoom}`).off('value', listeners.members);
    }

    currentRoom = roomKey;
    lastAuthor  = '';

    // Clear messages (keep welcome)
    const nodes = messagesInner.querySelectorAll('.message-row, .date-divider');
    nodes.forEach(n => n.remove());

    // Update header
    db.ref(`rooms/${roomKey}`).once('value', snap => {
        const room = snap.val();
        if (room) roomTitle.textContent = room.name;
    });

    // Mark active in sidebar
    roomListEl.querySelectorAll('.room-item').forEach(el => el.classList.remove('active'));
    roomListEl.querySelectorAll('.room-item').forEach(el => {
        if (el.querySelector('.room-name')?.textContent === roomTitle.textContent) {
            el.classList.add('active');
        }
    });

    // Join room membership
    db.ref(`roomMembers/${roomKey}/${currentUser.uid}`).set({
        name: currentUser.displayName,
        color: currentUser.color,
        joinedAt: Date.now()
    });
    db.ref(`roomMembers/${roomKey}/${currentUser.uid}`).onDisconnect().remove();

    // Listen for messages
    let prevDate = '';
    listeners.messages = db.ref(`messages/${roomKey}`)
        .orderByChild('timestamp')
        .limitToLast(messageLimit)
        .on('child_added', snap => {
            const msg = snap.val();
            const msgDate = dateLabel(msg.timestamp);

            // Date divider
            if (msgDate !== prevDate) {
                prevDate = msgDate;
                const divider = document.createElement('div');
                divider.className = 'date-divider';
                divider.innerHTML = `<span>${msgDate}</span>`;
                messagesInner.appendChild(divider);
            }

            appendMessage(msg);
            scrollToBottom();
        });

    // Listen for typing
    listeners.typing = db.ref(`typing/${roomKey}`).on('value', snap => {
        const typers = snap.val() || {};
        const names = Object.entries(typers)
            .filter(([k, v]) => k !== currentUser.uid && v.active)
            .map(([, v]) => v.name);

        if (names.length > 0) {
            typingText.textContent = names.length === 1
                ? `${names[0]} is typing…`
                : `${names.join(', ')} are typing…`;
            typingIndicator.classList.add('active');
        } else {
            typingIndicator.classList.remove('active');
        }
    });

    // Listen for members
    listeners.members = db.ref(`roomMembers/${roomKey}`).on('value', snap => {
        const members = snap.val() || {};
        const count = Object.keys(members).length;
        memberNum.textContent = count;
        renderMembers(members);
    });

    // Close sidebar on mobile
    sidebar.classList.remove('open');
}

// ────────────────  RENDER MESSAGE  ────────────────
function appendMessage(msg) {
    const own  = msg.uid === currentUser.uid;
    const cont = msg.uid === lastAuthor;
    lastAuthor = msg.uid;

    const row = document.createElement('div');
    row.className = 'message-row' + (own ? ' own' : '') + (cont ? ' cont' : '');

    const color = msg.color || pickColor(msg.displayName);

    row.innerHTML = `
        <div class="msg-avatar" style="background:${color}">${initials(msg.displayName)}</div>
        <div class="msg-content">
            <div class="msg-header">
                <span class="msg-author">${escapeHtml(msg.displayName)}</span>
                <span class="msg-time">${timeStr(msg.timestamp)}</span>
            </div>
            <div class="msg-bubble">${formatText(msg.text)}</div>
        </div>`;

    messagesInner.appendChild(row);
}

function formatText(text) {
    // Basic markdown-ish formatting
    let s = escapeHtml(text);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
    s = s.replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>');
    s = s.replace(/\n/g, '<br>');
    // Linkify URLs
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:#00c6ff;text-decoration:underline;">$1</a>');
    return s;
}

// ────────────────  SEND MESSAGE  ────────────────
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !currentRoom || !currentUser) return;

    db.ref(`messages/${currentRoom}`).push({
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        color: currentUser.color,
        text: text,
        timestamp: Date.now()
    });

    messageInput.value = '';
    messageInput.style.height = 'auto';
    clearTypingFlag();
}

// ────────────────  TYPING INDICATOR  ────────────────
let typingTimeout;
messageInput.addEventListener('input', () => {
    if (!currentRoom || !currentUser) return;
    autoResize();

    db.ref(`typing/${currentRoom}/${currentUser.uid}`).set({
        name: currentUser.displayName,
        active: true
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(clearTypingFlag, 2000);
});

function clearTypingFlag() {
    if (!currentRoom || !currentUser) return;
    db.ref(`typing/${currentRoom}/${currentUser.uid}`).set({ name: currentUser.displayName, active: false });
}

// ────────────────  AUTO-RESIZE TEXTAREA  ────────────────
function autoResize() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// ────────────────  SCROLL  ────────────────
function scrollToBottom(smooth = true) {
    requestAnimationFrame(() => {
        msgContainer.scrollTo({
            top: msgContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    });
}

msgContainer.addEventListener('scroll', () => {
    const atBottom = msgContainer.scrollHeight - msgContainer.scrollTop - msgContainer.clientHeight < 120;
    scrollBottomBtn.classList.toggle('visible', !atBottom);
});

scrollBottomBtn.addEventListener('click', () => scrollToBottom());

// ────────────────  MEMBERS PANEL  ────────────────
membersBtn.addEventListener('click', () => membersPanel.classList.toggle('open'));
closeMembersBtn.addEventListener('click', () => membersPanel.classList.remove('open'));

function renderMembers(members) {
    membersList.innerHTML = '';
    Object.entries(members).forEach(([uid, m]) => {
        const el = document.createElement('div');
        el.className = 'member-item';
        const color = m.color || pickColor(m.name);
        el.innerHTML = `
            <div class="member-avatar" style="background:${color}">${initials(m.name)}</div>
            <div>
                <div class="member-name">${escapeHtml(m.name)}${uid === currentUser.uid ? ' (You)' : ''}</div>
                <div class="member-status-text">Online</div>
            </div>`;
        membersList.appendChild(el);
    });
}

// ────────────────  CREATE ROOM  ────────────────
createRoomBtn.addEventListener('click', () => {
    roomModal.classList.remove('hidden');
    roomNameInput.value = '';
    roomNameInput.focus();
});

cancelRoomBtn.addEventListener('click', () => {
    roomModal.classList.add('hidden');
});

confirmRoomBtn.addEventListener('click', createRoom);
roomNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') createRoom(); });

function createRoom() {
    const name = roomNameInput.value.trim();
    if (!name) { roomNameInput.style.borderColor = '#ef4444'; return; }

    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    db.ref(`rooms/${key}`).set({
        name: name,
        createdAt: Date.now(),
        createdBy: currentUser.uid
    });

    roomModal.classList.add('hidden');
    setTimeout(() => switchRoom(key), 300);
}

// ────────────────  SIDEBAR TOGGLE (MOBILE)  ────────────────
sidebarOpen.addEventListener('click', () => sidebar.classList.add('open'));
sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

// Close sidebar on outside click (mobile)
document.addEventListener('click', e => {
    if (window.innerWidth <= 900 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && e.target !== sidebarOpen && !sidebarOpen.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    }
});

// ────────────────  INIT  ────────────────
showNameModal();
