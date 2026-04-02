const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});
document.addEventListener("mousemove", (e) => {
    const x = e.clientX + "px";
    const y = e.clientY + "px";

    document.documentElement.style.setProperty("--x", x);
    document.documentElement.style.setProperty("--y", y);
});
const loginForm = document.querySelector(".sign-in form");
const signupForm = document.querySelector(".sign-up form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = loginForm.querySelector('input[type="email"]').value;
  const password = loginForm.querySelector('input[type="password"]').value;

  // Mocking the backend for frontend demonstration
  setTimeout(() => {
    alert("Login successful");
    localStorage.setItem("user", JSON.stringify({ email: email, name: "User" }));

    const profileDone = localStorage.getItem("profileCompleted");
    if (profileDone === "true") {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "profile_setup.html";
    }
  }, 500);
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = signupForm.querySelector('input[type="text"]').value;
  const email = signupForm.querySelector('input[type="email"]').value;
  const password = signupForm.querySelector('input[type="password"]').value;

  // Mocking the backend for frontend demonstration
  setTimeout(() => {
    alert("Account Created Successfully");
    localStorage.setItem("user", JSON.stringify({ name: name, email: email }));
    window.location.href = "profile_setup.html";
  }, 500);
});

// Social Login Mock
const socialIcons = document.querySelectorAll('.social-login');
socialIcons.forEach(icon => {
    icon.addEventListener('click', (e) => {
        e.preventDefault();
        const provider = icon.getAttribute('data-provider');
        if (provider) {
            // Simulate OAuth login
            icon.style.pointerEvents = "none";
            const originalHTML = icon.innerHTML;
            icon.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i>";
            
            setTimeout(() => {
                const userName = "User_" + Math.floor(Math.random() * 1000);
                const email = userName + "@example.com";
                
                alert(`Successfully authenticated with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`);
                localStorage.setItem("user", JSON.stringify({ name: userName, email: email, provider: provider }));
                
                // Redirect logic
                const profileDone = localStorage.getItem("profileCompleted");
                if (profileDone === "true") {
                    window.location.href = "dashboard.html";
                } else {
                    window.location.href = "profile_setup.html";
                }
            }, 1000);
        }
    });
});


