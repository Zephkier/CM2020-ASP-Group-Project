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
    });
});

// TODO move to helper.js
/**
 * Ensure user **has** existing login credentials in database, then allowed to proceed.
 *
 * @returns
 * - If user **has** existing credentials in database,
 * then store `users` table fields into `request.session.user`, and proceed.
 *
 * - If user **does not have** existing credentials in database,
 * then redirect to login page with error message.
 */
function db_isExistingUser(request, response, next) {
    let query = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
    let params = [request.body.usernameOrEmail, request.body.usernameOrEmail, request.body.password];
    db.get(query, params, (err, existingUser) => {
        if (err) return errorPage(response, "Database error 1!");
        if (!existingUser)
            return response.render("user/login.ejs", {
                pageName: "Login",
                errorMessage: "Invalid login credentials",
            });
        request.session.user = existingUser;
        return next();
    });
}

// TODO move to helper.js
function db_getUserInfoForProfile(request, response, next) {
    let query = `
        SELECT *
        FROM profiles JOIN users
        ON profiles.user_id = users.id
        WHERE profiles.user_id = ?`;
    db.get(query, [request.session.user.id], (err, userProfileInfo) => {
        if (err) return errorPage(response, "Database error 2!");
        if (!userProfileInfo)
            return response.render("user/login.ejs", {
                pageName: "Login",
                errorMessage: "Profile not found. Please complete your registration.",
            });

        request.session.user = userProfileInfo;
        return next();
    });
}

router.post("/login", db_isExistingUser, db_getUserInfoForProfile, (request, response) => {
    // This is for when not-logged-in users checkout their cart
    // Thus, upon login, they are redirected to checkout page
    if (request.session.cart) return response.redirect("/checkout");

    // Under normal circumstances, redirect to profile page
    return response.redirect("/user/profile");
});

// TODO move to helper.js
function db_getEnrolledCoursesForProfile(request, response, next) {
    let query = `
        SELECT courses.name, courses.description
        FROM enrollments JOIN courses
        ON enrollments.course_id = courses.id
        WHERE enrollments.user_id = ?`;
    db.all(query, [request.session.user.id], (err, enrolledCourses) => {
        if (err) return errorPage(response, "Database error 3!");
        if (!enrolledCourses) return errorPage(response, "Unable to load your enrolled courses!");
        request.session.user.enrolledCourses = enrolledCourses || [];
        next();
    });
}

// Profile
router.get("/profile", isLoggedIn, db_getEnrolledCoursesForProfile, (request, response) => {
    console.log(request.session);
    return response.render("user/profile.ejs", {
        pageName: "My Profile",
        user: request.session.user,
        enrolledCourses: request.session.user.enrolledCourses,
    });
});

// TODO change endpoint
router.get("/edit-profile", (request, response) => {
    return response.render("user/edit-profile.ejs", {
        pageName: "Edit Profile",
    });
});

// TODO change endpoint
router.post("/update-profile", (request, response) => {
    let query = `
        UPDATE profiles
        SET displayName = ?, bio = ?, introduction = ?, profilePicture = ?
        WHERE user_id = ?`;
    let { displayName, bio, introduction, profilePicture } = request.body;
    db.run(query, [displayName, bio, introduction, profilePicture, request.session.user.userId], (err) => {
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
        errors: {},
        formInputStored: {
            major: "Not enrolled",
            year: "0",
            department: "No department",
            title: "No title",
        },
    });
});

// TODO move to helper.js
function db_isUnique_usernameAndEmail(request, response, next) {
    let errors = {};

    db.get("SELECT * FROM users WHERE username = ?", [request.body.username], (err, existingUsername) => {
        if (err) return errorPage(response, "Database error 5!");
        if (existingUsername) errors.username = "This username has been registered.";

        db.get("SELECT * FROM users WHERE email = ?", [request.body.email], (err, existingEmail) => {
            if (err) return errorPage(response, "Database error 6!");
            if (existingEmail) errors.email = "This email has been registered.";

            // If "errors" have no properties/keys, then proceed
            if (Object.keys(errors).length == 0) return next();

            // If "errors" has properties/keys, then re-render register page
            return response.render("user/register.ejs", {
                pageName: "Register",
                errors: errors,
                formInputStored: request.body,
            });
        });
    });
}

router.post("/register", db_isUnique_usernameAndEmail, (request, response, next) => {
    let { role, username, email, password, major, year, department, title } = request.body;

    /**
     * Upon ensuring unique username and email:
     * 1. Insert into "users" table
     * 2. Get latest "users.id" for step 3 and 4
     * 3. Insert into "students" or "educators" table
     * 4. Insert into "profiles" table
     * 5. Redirect to login page
     */

    // 1. Insert into "users" table
    let query = "INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)";
    let params = [email, username, password, role];
    db.run(query, params, (err) => {
        if (err) return errorPage(response, "Database error 7!");

        // 2. Get latest "users.id" for following inserts
        query = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
        params = [username, email, password];
        db.get(query, params, (err, existingUser) => {
            if (err) return errorPage(response, "Database error 8!");
            if (!existingUser) return errorPage(response, "Something went terribly wrong!");

            // 3. Insert into "students" or "educators" table
            if (role === "student") {
                query = "INSERT INTO students (user_id, major, year) VALUES (?, ?, ?)";
                param = [existingUser.id, major, year];
            } else if (role === "educator") {
                query = "INSERT INTO educators (user_id, department, title) VALUES (?, ?, ?)";
                param = [existingUser.id, department, title];
            }
            db.run(query, param, (err) => {
                if (err) return errorPage(response, "Database error during role-specific insert!");

                // 4. Insert into "profiles" table
                query = "INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (?, ?, ?, ?, ?)";
                params = [
                    // Format
                    existingUser.id,
                    username,
                    `Hi there, I'm ${existingUser.username} and this is my bio!`,
                    `Hi there, I'm ${existingUser.username} and this is my introduction!`,
                    "dog.png",
                ];
                db.run(query, params, (err) => {
                    if (err) return errorPage(response, "Database error during profile insert!");

                    // 5. Redirect to login page
                    return response.redirect("/user/login");
                });
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
