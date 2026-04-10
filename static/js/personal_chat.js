const urlParams = new URLSearchParams(window.location.search);
const receiverId = urlParams.get('user_id');
const chatWithName = urlParams.get('name') || 'Partner';
document.getElementById('chatName').innerText = chatWithName;
document.getElementById('systemName').innerText = chatWithName;

// Grab profile pic from localstorage if possible
const matches = JSON.parse(localStorage.getItem('skillSwipeMatches')) || [];
const matchedProfile = matches.find(m => m.name === chatWithName);
if (matchedProfile && matchedProfile.pic) {
    document.getElementById('chatAvatar').src = matchedProfile.pic;
}

function goBack() {
    if (!hackathonId) {
        window.location.href = "/dashboard";
    } else {
        window.location.href = `/matches?hackathon=${hackathonId}`;
    }
}

const chatArea = document.getElementById('chatArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

function appendMessage(text, type) {
    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${type}`;

    const content = document.createElement('div');
    content.className = 'msg-content';
    content.innerText = text;

    const time = document.createElement('span');
    time.className = 'time';
    time.innerText = formatTime(new Date());

    content.appendChild(time);
    wrapper.appendChild(content);

    chatArea.appendChild(wrapper);
    chatArea.scrollTop = chatArea.scrollHeight;
}



async function handleSend() {
    const text = messageInput.value.trim();
    if (!text) return;

    appendMessage(text, 'sent');
    messageInput.value = '';

    try {
        await fetch("/api/chat/send", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                receiver_id: receiverId,
                content: text
            })
        });
    } catch (e) {
        console.error("Send error:", e);
    }
}

sendBtn.addEventListener('click', handleSend);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});


async function loadMessages() {
    const res = await fetch(`/api/chat/${receiverId}`);
    const data = await res.json();

    chatArea.innerHTML = "";

    data.messages.forEach(msg => {
        if (msg.sender_id == receiverId) {
            appendMessage(msg.content, "received");
        } else {
            appendMessage(msg.content, "sent");
        }
    });
}

setInterval(loadMessages, 2000);

loadMessages();

