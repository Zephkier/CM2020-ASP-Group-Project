// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const { errorPage, isNotLoggedIn, isLoggedIn } = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs has "/user" prefix!

// Home: Aka profile page
router.get("/", (request, response) => {
    return response.redirect("/user/profile");
});

// Login
router.get("/login", (request, response) => {
    return response.render("user/login.ejs", {
        pageName: "Login",
        errorMessage: null,
        usernameOrEmailStored: null,
    });
});

// TODO move to helper.js
/**
 * Ensure user **has** existing login credentials in database, then allowed to proceed.
 *
 * @returns
 * - If user **has** existing credentials in database,
 * then store user's `id` into `request.idThatIsLoggingIn`, and proceed.
 *
 * - If user **does not have** existing credentials in database,
 * then redirect to login page with error message.
 */
function db_isExistingUser(request, response, next) {
    let userOrEmail = request.body.usernameOrEmail;
    let query = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
    let params = [userOrEmail, userOrEmail, request.body.password];
    db.get(query, params, (err, existingUser) => {
        if (err) return errorPage(response, "Database error!");
        if (!existingUser)
            return response.render("user/login.ejs", {
                pageName: "Login",
                errorMessage: "Invalid login credentials",
                usernameOrEmailStored: userOrEmail,
            });
        request.idThatIsLoggingIn = existingUser.id;
        return next();
    });
}

router.post("/login", db_isExistingUser, (request, response) => {
    let query = `
        SELECT *
        FROM profiles JOIN users
        ON profiles.user_id = users.id
        WHERE profiles.user_id = ?`;
    db.get(query, [request.idThatIsLoggingIn], (err, userProfileInfo) => {
        // Delete/Clear the property (for security reasons, if any)
        delete request.idThatIsLoggingIn;
        if (err) return errorPage(response, "Database error!");
        if (!userProfileInfo)
            return response.render("user/login.ejs", {
                pageName: "Login",
                errorMessage: "Profile not found. Please complete your registration.",
                usernameOrEmailStored: request.body.usernameOrEmail,
            });

        // Store query result
        request.session.user = userProfileInfo;

        // This is for when not-logged-in users checkout their cart
        // Thus, upon login, they are redirected to checkout page
        if (request.session.cart) return response.redirect("/checkout");

        // Under normal circumstances, redirect to profile page
        return response.redirect("/user/profile");
    });
});

// Profile
router.get("/profile", isLoggedIn, (request, response) => {
    let query = `
        SELECT courses.id, courses.name, courses.description
        FROM enrollments JOIN courses
        ON enrollments.course_id = courses.id
        WHERE enrollments.user_id = ?`;
    db.all(query, [request.session.user.id], (err, enrolledCourses) => {
        if (err) return errorPage(response, "Database error!");
        if (!enrolledCourses) return errorPage(response, "Unable to load your enrolled courses!");

        enrolledCourses = enrolledCourses || [];
        return response.render("user/profile.ejs", {
            pageName: "My Profile",
            user: request.session.user,
            enrolledCourses: enrolledCourses,
        });
    });
});

// TODO change endpoint
router.get("/edit-profile", (request, response) => {
    return response.render("user/edit-profile.ejs", {
        pageName: "Edit Profile",
    });
});

// TODO change endpoint

///user/profile/update
router.post("/update-profile", (request, response) => {
    console.log("rrhh");
    let query = `
        UPDATE profiles
        SET displayName = ?, bio = ?, introduction = ?, profilePicture = ?
        WHERE user_id = ?`;
    let { displayName, bio, introduction, profilePicture } = request.body;
    db.run(query, [displayName, bio, introduction, profilePicture, request.session.user.id], (err) => {
        if (err) return errorPage(response, "Database error 4!");
        request.session.user.displayName = displayName;
        request.session.user.bio = bio;
        request.session.user.introduction = introduction;
        request.session.user.profilePicture = profilePicture;
        return response.redirect("/user/profile");
    });
});

// Register: Ensure user is not logged in
router.get("/register", isNotLoggedIn, (request, response) => {
    return response.render("user/register.ejs", {
        pageName: "Register",
    });
});

router.post("/register", (request, response) => {
    let { role, username, email, password, major, year, department, title } = request.body;

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

            let userId = this.lastID;

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
            let query = "INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (?, ?, ?, ?, ?)";
            let params = [userId, username, "Hi there, this is my bio!", "Hi there, this is my introduction!", "dog.png"];
            db.run(query, params, (err) => {
                if (err) return errorPage(response, "Database error!");
                return response.redirect("/user/login");
            });
        });
    });
});

// Logout
router.get("/logout", (request, response) => {
    request.session.destroy();
    return response.redirect("/");
});

module.exports = router;
