const urlParams = new URLSearchParams(window.location.search);
const chatWithName = urlParams.get('chatwith') || 'Partner';

document.getElementById('chatName').innerText = chatWithName;
document.getElementById('systemName').innerText = chatWithName;

// Grab profile pic from localstorage if possible
const matches = JSON.parse(localStorage.getItem('skillSwipeMatches')) || [];
const matchedProfile = matches.find(m => m.name === chatWithName);
if (matchedProfile && matchedProfile.pic) {
    document.getElementById('chatAvatar').src = matchedProfile.pic;
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

// Bot auto-reply Mock
const botReplies = [
    "Hey! Yeah, I'm really looking forward to teaming up.",
    "That sounds like a great idea!",
    "Actually, I have some experience with that stack.",
    "Let's schedule a brief call tomorrow to discuss further?",
    "Awesome, sending you my github repo now.",
    "I agree. What time works best for you?"
];

function handleSend() {
    const text = messageInput.value.trim();
    if (text) {
        appendMessage(text, 'sent');
        messageInput.value = '';

        // Mock auto-reply
        setTimeout(() => {
            document.querySelector('.status').innerText = "typing...";
            setTimeout(() => {
                const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
                appendMessage(randomReply, 'received');
                document.querySelector('.status').innerText = "Online";
            }, 1200);
        }, 600);
    }
}

sendBtn.addEventListener('click', handleSend);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});


