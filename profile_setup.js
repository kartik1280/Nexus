// ================= IMAGE PREVIEW =================
const profileInput = document.getElementById("profilePic");
const previewImage = document.getElementById("previewImage");
const profilePicContainer = document.getElementById("profilePicContainer");

profilePicContainer.addEventListener("click", () => {
    profileInput.click();
});

profileInput.addEventListener("change", function () {
    const file = this.files[0];

    if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onload = function (e) {
            previewImage.src = e.target.result;
        };

        reader.readAsDataURL(file);
    } else {
        alert("Please upload a valid image!");
    }
});


// ================= FORM SUBMIT =================
document.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();

    const loggedInEmail = localStorage.getItem("loggedInUser");

    if (!loggedInEmail) {
        alert("User not logged in!");
        return;
    }

    let user = JSON.parse(localStorage.getItem(loggedInEmail)) || {};

    // Collect all values
    user.name = document.getElementById("name").value;
    user.course = document.getElementById("course").value;
    user.year = document.getElementById("year").value;

    // ⭐ Better: store skills as array
    user.skills = document.getElementById("skills").value.split(",");

    user.experience = document.getElementById("experience").value;
    user.interests = document.getElementById("interests").value;
    user.role = document.getElementById("role").value;
    user.availability = document.getElementById("availability").value;
    user.github = document.getElementById("github").value;

    //  Save image
    user.profilePic = previewImage.src;

    // Save
    localStorage.setItem(loggedInEmail, JSON.stringify(user));

    alert("Profile Saved Successfully 🎉");

    window.location.href = "dashboard.html";
});