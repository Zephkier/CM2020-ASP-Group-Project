document.addEventListener("DOMContentLoaded", () => {
    // In URL, search for any "?error="
    let urlParams = new URLSearchParams(window.location.search);
    let error = urlParams.get("error");
    if (error) {
        let message = null;

        // Redirect to wherever needed
        if (error == "invalid_url") message = "Invalid URL!";

        // Redirect to /user/profile
        if (error == "already_logged_in") message = "You are <b>already</b> logged in!";
        if (error == "no_permission") message = "You do not have permission to access this page!";
        if (error == "not_enrolled") message = "You are not enolled into this course!";

        // Redirect to /user/login
        if (error == "not_logged_in") message = "You must login first!";

        // Redirect to /courses
        if (error.includes("already_in_cart")) message = `The "${error.split("_")[0]}" course is already in your cart!<br>Your cart has <b>remained unchanged</b>.`;

        // Redirect to /course
        if (error.includes("no_topics_yet")) message = `This course has no learning content yet.<br>Please wait for the educator to update.`;

        // Redirect to /cart
        if (error == "empty_checkout") message = "You cannot checkout an <b>empty</b> cart!";

        // Redirect to /checkout
        if (error == "already_enrolled") message = "You are already enrolled into the course!<br>No payment was made.<br>Your cart has <b>remained unchanged</b>.";

        if (message) {
            // Set <p>'s text to message
            document.getElementById("popup-message").innerHTML = message;
            // Display entire <div> by removing "hidden" class that was used to hide it
            document.getElementById("popup").classList.remove("hidden");
        }
    }

    document.getElementById("popup-close").addEventListener("click", () => {
        document.getElementById("popup").classList.add("hidden");
    });
});
