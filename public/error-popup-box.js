document.addEventListener("DOMContentLoaded", () => {
    // In URL, search for any "?error="
    let urlParams = new URLSearchParams(window.location.search);
    let error = urlParams.get("error");
    if (error) {
        let message = null;

        // Redirect to /cart
        if (error == "already_in_cart") message = "Selected course is <b>already</b> in your cart!<br>Your cart has <b>remained unchanged</b>.";
        if (error == "empty_checkout") message = "You cannot checkout an <b>empty</b> cart!";

        // Redirect to /checkout
        if (error == "already_enrolled") message = "You are already enrolled into the course!<br>No payment was made.<br>Your cart has <b>remained unchanged</b>.";

        // Redirect to /user/profile
        if (error == "already_logged_in") message = "You are <b>already</b> logged in!<br>You cannot register again.";

        // Redirect to /user/login
        if (error == "not_logged_in") message = "You must login first!";

        if (message) {
            document.getElementById("popup-message").innerHTML = message; // Set <p>'s text to message
            document.getElementById("popup").classList.remove("hidden"); // Display entire <div> by removing "hidden" class that was used to hide it
        }
    }

    document.getElementById("popup-close").addEventListener("click", () => {
        document.getElementById("popup").classList.add("hidden");
    });
});
