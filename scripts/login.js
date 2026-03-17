const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

// If already logged in → go to dashboard
const loggedInUser = localStorage.getItem("loggedInUser");
if (loggedInUser) {
    window.location.href = "dashboard.html";
}

// SIGNUP
document.querySelector(".sign-up form").addEventListener("submit", function (e) {
    e.preventDefault();

    const name = this.querySelector("input[placeholder='Name']").value;
    const email = this.querySelector("input[placeholder='Email']").value;
    const password = this.querySelector("input[placeholder='Password']").value;

    const user = {
        name,
        email,
        password,
        matches: [],
        futureTeam: []
    };

    localStorage.setItem(email, JSON.stringify(user));
    alert("Account Created Successfully!");
});

// LOGIN
document.querySelector(".sign-in form").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = this.querySelector("input[placeholder='Email']").value;
    const password = this.querySelector("input[placeholder='Password']").value;

    const storedUser = JSON.parse(localStorage.getItem(email));

    if (storedUser && storedUser.password === password) {
        localStorage.setItem("loggedInUser", email);
        window.location.href = "dashboard.html";
    } else {
        alert("Invalid Credentials");
    }
});