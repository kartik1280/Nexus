// ================= INTERSECTION OBSERVER (FADE IN) =================
const faders = document.querySelectorAll('.fade');

const observer = new IntersectionObserver(
    entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger siblings inside a grid
                const siblings = entry.target.parentElement.querySelectorAll('.fade:not(.show)');
                siblings.forEach((el, idx) => {
                    setTimeout(() => el.classList.add('show'), idx * 80);
                });
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12 }
);

faders.forEach(el => observer.observe(el));


// ================= NAVBAR SCROLL TINT =================
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
        nav.style.background = 'rgba(8, 6, 20, 0.92)';
        nav.style.boxShadow = '0 1px 32px rgba(109, 40, 217, 0.12)';
    } else {
        nav.style.background = 'rgba(8, 6, 20, 0.72)';
        nav.style.boxShadow = 'none';
    }
}, { passive: true });


// ================= SMOOTH ANCHOR SCROLL =================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});


// ================= CARD TILT (SUBTLE) =================
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotX = -(y / rect.height) * 5;
        const rotY = (x / rect.width) * 5;
        card.style.transform = `translateY(-8px) perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        setTimeout(() => card.style.transition = '', 500);
    });
});
