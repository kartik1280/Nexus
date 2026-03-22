const profiles = [
    {
        name: "Aryan Sharma",
        image: "Profiles/aryan.avif",
        course: "BTech CSE (AI)",
        year: "2nd Year",
        skills: ["Python", "ML", "TensorFlow"],
        experience: "3 hackathons · AI chatbot & recommender system"
    },
    {
        name: "Riya Mehta",
        image: "Profiles/riya.avif",
        course: "BTech IT",
        year: "3rd Year",
        skills: ["React", "UI/UX", "Figma"],
        experience: "Frontend lead in 2 hackathons"
    },
    {
        name: "Kabir Verma",
        image: "Profiles/kabir.avif",
        course: "BTech CSE",
        year: "1st Year",
        skills: ["C++", "DSA", "Logic Building"],
        experience: "Competitive programming beginner"
    },
    {
        name: "Sneha Iyer",
        image: "Profiles/sneha.avif",
        course: "BTech CSE (Data Science)",
        year: "4th Year",
        skills: ["SQL", "Power BI", "Python"],
        experience: "Data analyst intern · 5+ projects"
    },
    {
        name: "Aditya Rao",
        image: "Profiles/aditya.avif",
        course: "BTech CSE",
        year: "3rd Year",
        skills: ["IoT", "Arduino", "Embedded C"],
        experience: "Built smart energy & health monitoring systems"
    }
];

let currentIndex = 0;

const container = document.getElementById("cardContainer");
const toast = document.getElementById("toast");

function renderCard() {
    container.innerHTML = "";

    if (currentIndex + 1 < profiles.length) {
        const next = document.createElement("div");
        next.className = "card";
        next.style.transform = "scale(0.95) translateY(10px)";
        next.style.opacity = "0.4";
        container.appendChild(next);
    }



    const profile = profiles[currentIndex];

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
    <img src="${profile.image}" class="profile-pic" />
    <h2>${profile.name}</h2>
    <p><strong>Course:</strong> ${profile.course}</p>
    <p><strong>Year:</strong> ${profile.year}</p>
    <p><strong>Experience:</strong> ${profile.experience}</p>
    <div class="skills">
      ${profile.skills.map(skill => `<span>${skill}</span>`).join("")}
    </div>
  `;

    container.appendChild(card);
}

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

function swipe(direction) {
    const card = document.querySelector(".card");
    if (!card) return;

    card.classList.add(direction === "right" ? "swipe-right" : "swipe-left");

    if (direction === "right") {
        const currentProfile = profiles[currentIndex];
        let matches = JSON.parse(localStorage.getItem('teamup_matches') || '[]');

        // Avoid duplicates
        if (!matches.some(m => m.name === currentProfile.name)) {
            matches.push(currentProfile);
            localStorage.setItem('teamup_matches', JSON.stringify(matches));
        }

        showToast(`Matched with ${currentProfile.name} successfully 🎉`);
    }

    setTimeout(() => {
        currentIndex++;
        renderCard();
    }, 400);
}

renderCard();
let startX = 0;
let isDragging = false;

document.addEventListener("mousedown", e => {
    const card = document.querySelector(".card");
    if (!card) return;

    isDragging = true;
    startX = e.clientX;
});

document.addEventListener("mousemove", e => {
    if (!isDragging) return;

    const card = document.querySelector(".card");
    if (!card) return;

    const moveX = e.clientX - startX;
    const rotate = moveX / 15;

    card.style.transform = `translateX(${moveX}px) rotate(${rotate}deg)`;

    card.classList.toggle("preview-like", moveX > 50);
    card.classList.toggle("preview-reject", moveX < -50);
});

document.addEventListener("mouseup", e => {
    if (!isDragging) return;
    isDragging = false;

    const card = document.querySelector(".card");
    if (!card) return;

    const moveX = e.clientX - startX;

    if (moveX > 120) swipe("right");
    else if (moveX < -120) swipe("left");
    else card.style.transform = "";
});
document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") swipe("right");
    if (e.key === "ArrowLeft") swipe("left");
});

