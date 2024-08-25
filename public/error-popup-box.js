document.addEventListener("DOMContentLoaded", () => {
    // In URL, search for any "?error="
    let urlParams = new URLSearchParams(window.location.search);
    let error = urlParams.get("error");
    if (error) {
        let message = null;

        // Redirect to /user/profile
        if (error == "already_logged_in") message = "You are already logged in and cannot register again!";

        // Redirect to /user/login
        if (error == "not_logged_in") message = "You must login first!";

        if (message) {
            document.getElementById("popup-message").textContent = message; // Set <p>'s text to message
            document.getElementById("popup").classList.remove("hidden"); // Display entire <div> by removing "hidden" class that was used to hide it
        }
    }

    document.getElementById("popup-close").addEventListener("click", () => {
        document.getElementById("popup").classList.add("hidden");
    });
});
