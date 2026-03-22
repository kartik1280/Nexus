document.querySelector('form').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = {
        name: document.querySelector('input[placeholder="Your full name"]').value,
        skills: document.querySelector('input[placeholder="React, Python, ML, UI/UX..."]').value.split(',').map(s => s.trim()),
        interests: document.querySelector('input[placeholder="Hackathons, Research, Startups..."]').value,
        role: document.querySelector('select').value,
        availability: document.querySelectorAll('select')[1].value,
        github: document.querySelector('input[placeholder="https://github.com/username"]').value,
        commitment: document.querySelector('input[type="range"]').value
    };

    // Save to localStorage as defined in PRD
    localStorage.setItem('teamup_me', JSON.stringify(formData));

    // Redirect to Swipe Page
    window.location.href = '../swipe function/swipe.html';
});
