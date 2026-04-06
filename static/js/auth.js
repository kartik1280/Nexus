document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("container");
    const registerBtn = document.getElementById("register");
    const loginBtn = document.getElementById("login");

    // Toggle animation
    registerBtn?.addEventListener("click", () => {
        container.classList.add("active");
    });

    loginBtn?.addEventListener("click", () => {
        container.classList.remove("active");
    });

    // Mouse glow effect
    document.addEventListener("mousemove", (e) => {
        document.documentElement.style.setProperty("--x", e.clientX + "px");
        document.documentElement.style.setProperty("--y", e.clientY + "px");
    });

    // Optional: loading state
    document.querySelectorAll(".main-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.innerText = "Please wait...";
        });
    });
});