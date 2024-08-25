// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const { errorPage, isLoggedIn, isNotLoggedIn } = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs has "/user" prefix!

// Home (redirects to profile page)
router.get("/", (request, response) => {
    return response.redirect("/user/profile");
});

// Login
router.get("/login", (request, response) => {
    console.log(request.session); // TEST
    return response.render("user/login.ejs", {
        pageName: "Login",
        errorMessage: null,
    });
});

router.post("/login", (request, response) => {
    // Ensure user exists in the database
    const { usernameOrEmail, password } = request.body;
    let query = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
    let params = [usernameOrEmail, usernameOrEmail, password];
    db.get(query, params, (err, existingUser) => {
        console.log(existingUser); // TEST
        if (err) return errorPage(response, "Database error!");
        if (!existingUser) return response.render("user/login.ejs", { pageName: "Login", errorMessage: "Invalid login credentials" });

        let profileQuery = `
            SELECT *
            FROM profiles JOIN users
            ON profiles.user_id = users.id
            WHERE profiles.user_id = ?`;
        db.get(profileQuery, [existingUser.id], (err, userInfo) => {
            console.log(request.session); // TEST
            if (err) return errorPage(response, "Database error!");
            if (!userInfo) return response.render("user/login.ejs", { pageName: "Login", errorMessage: "Profile not found. Please complete your registration." });
            request.session.user = userInfo; // Store userInfo in session object
            if (request.session.cart) return response.redirect("/checkout");
            return response.redirect("/user/profile");
        });
    });
});

// Logout
router.get("/logout", (request, response) => {
    request.session.destroy();
    return response.redirect("/");
});

// Register - If user is already logged in (but tries to go to "/user/register"), then it redirects to profile with "error=" in URL
router.get("/register", isLoggedIn, (request, response) => {
    return response.render("user/register.ejs", {
        pageName: "Register",
    });
});

router.post("/register", (request, response) => {
    const { role, username, email, password, major, year, department, title } = request.body;

    // Check if the email already exists
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, existingUser) => {
        if (err) return errorPage(response, "Database error!");
        if (existingUser) {
            return response.render("register.ejs", {
                pageName: "Register",
                errors: { email: "This email is already registered." },
                formData: { username, email, major, year, department, title },
            });
        }
        // Proceed with registration if email does not exist
        db.run("INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)", [email, username, password, role], function (err) {
            // db.run("INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)", [email, username, password, role], (err) => { // FIXME cannot use this syntax
            if (err) return errorPage(response, "Database error!");

            const userId = this.lastID;

            if (role === "student") {
                let query = "INSERT INTO students (user_id, major, year) VALUES (?, ?, ?)";
                let params = [userId, major || "Not enrolled", year || 0];
                db.run(query, params, (err) => {
                    if (err) return errorPage(response, "Database error!");
                });
            } else if (role === "educator") {
                let query = "INSERT INTO educators (user_id, department, title) VALUES (?, ?, ?)";
                let params = [userId, department || "No department", title || "No title"];
                db.run(query, params, (err) => {
                    if (err) return errorPage(response, "Database error!");
                });
            }

            // Create profile for new user
            console.log("Creating profile for new user..."); // TEST
            let query = "INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (?, ?, ?, ?, ?)";
            let params = [userId, username, "Hi there, this is my bio!", "Hi there, this is my introduction!", "dog.png"];
            db.run(query, params, (err) => {
                if (err) return errorPage(response, "Database error!");
                return response.redirect("/user/login");
            });
        });
    });
});

// Profile
router.get("/profile", isNotLoggedIn, (request, response) => {
    // Fetch user profile information and enrolled courses
    db.all(
        `
        SELECT courses.name, courses.description
        FROM enrollments JOIN courses
        ON enrollments.course_id = courses.id
        WHERE enrollments.user_id = ?`,
        [request.session.user.id],
        (err, enrolledCourses) => {
            console.log(enrolledCourses); // TEST
            if (err) return errorPage(response, "Database error!");
            enrolledCourses = enrolledCourses || [];
            response.render("user/profile.ejs", {
                pageName: "My Profile",
                user: request.session.user,
                enrolledCourses: enrolledCourses,
            });
        }
    );
});

router.get("/edit-profile", (request, response) => {
    response.render("user/edit-profile.ejs", {
        pageName: "Edit Profile",
    });
});

router.post("/update-profile", (request, response) => {
    const userId = request.session.user.userId;
    const { displayName, bio, introduction, profilePicture } = request.body;

    // Update the user's profile in the database
    const updateQuery = `
        UPDATE profiles
        SET displayName = ?, bio = ?, introduction = ?, profilePicture = ?
        WHERE user_id = ?`;
    db.run(updateQuery, [displayName, bio, introduction, profilePicture, userId], (err) => {
        if (err) return errorPage(response, "Database error!");
        // Update the session data with the new values
        request.session.user.displayName = displayName;
        request.session.user.bio = bio;
        request.session.user.introduction = introduction;
        request.session.user.profilePicture = profilePicture;
        response.redirect("/user/profile");
    });
});

module.exports = router;
