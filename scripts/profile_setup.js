document.querySelector("form")?.addEventListener("submit", function (e) {
    e.preventDefault();

    const loggedInEmail = localStorage.getItem("loggedInUser");
    const user = JSON.parse(localStorage.getItem(loggedInEmail));

    user.skills = document.querySelector("#skills").value;
    user.bio = document.querySelector("#bio").value;

    localStorage.setItem(loggedInEmail, JSON.stringify(user));

    alert("Profile Updated!");
});

const profileInput = document.getElementById("profilePic");
const previewImage = document.getElementById("previewImage");

profileInput.addEventListener("change", function () {

    const file = this.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            previewImage.src = e.target.result;
        }

        reader.readAsDataURL(file);
    }

});