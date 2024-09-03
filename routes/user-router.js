// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // General helper functions
    return_twoDecimalPlaces,
    return_validPictureFilename,
    return_formattedNumber,
    errorPage,
    isLoggedIn,
    isNotLoggedIn,
    // Database-related helper functions
    db_isExistingUser_promise,
    db_getProfileInfo_promise,
    db_getProfileRecentActivities_promise,
    db_getProfileEnrolledCourses_promise,
    db_getProfileCreatedCourses_promise,
    db_isUniqueLoginCredentials_promise,
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs have "/user" prefix!

// Home (Profile)
router.get("/", (request, response) => {
    return response.redirect("/user/profile");
});

// Login
router.get("/login", isNotLoggedIn, (request, response) => {
    return response.render("user/login.ejs", {
        pageName: "Login",
        usernameOrEmailStored: null,
        errorMessage: null,
    });
});

router.post("/login", async (request, response) => {
    try {
        // If user's login credentials are invalid (eg. incorrect or does not exist)
        request.session.user = await db_isExistingUser_promise(request.body.usernameOrEmail, request.body.password);
        // If user has no matching "id" to get profile info
        request.session.user = await db_getProfileInfo_promise(request.session.user.id);
    } catch (err) {
        // Then re-render login page
        return response.render("user/login.ejs", {
            pageName: "Login",
            usernameOrEmailStored: request.body.usernameOrEmail,
            errorMessage: err.message,
        });
    }

    // This is for when not-logged-in users checkout their cart
    // Thus, upon login, redirect to checkout page
    if (request.session.cart) return response.redirect("/student/checkout");

    // But under normal circumstances (eg. login normally), redirect to profile page
    return response.redirect("/user/profile");
});

// Profile
router.get("/profile", isLoggedIn, async (request, response) => {
    let userId = request.session.user.id;

    // Too many promises to await, so just "try-catch" entire block
    try {
        // Common queries for both student and educator
        let profile = await db_getProfileInfo_promise(userId);
        let recentActivities = await db_getProfileRecentActivities_promise(userId);

        // Role-specific queries
        let roleSpecificData;
        if (request.session.user.role == "student") {
            roleSpecificData = await db_getProfileEnrolledCourses_promise(userId);
            profile.enrolledCourses = roleSpecificData.map((course) => {
                course.price = return_twoDecimalPlaces(course.price);
                course.picture = return_validPictureFilename("./public/images/courses/", course.name);
                return course;
            });
        }
        if (request.session.user.role == "educator") {
            roleSpecificData = await db_getProfileCreatedCourses_promise(userId);
            profile.createdCourses = roleSpecificData.map((course) => {
                course.price = return_twoDecimalPlaces(course.price);
                course.picture = return_validPictureFilename("./public/images/courses/", course.name);
                course.enrollCount = return_formattedNumber(course.enrollCount);
                return course;
            });
        }

        // Back to (nearly) common code for both student and educator
        return response.render("user/profile.ejs", {
            pageName: request.session.user.role == "student" ? "Student Profile" : "Educator Profile",
            user: request.session.user,
            profile: profile,
            recentActivities: recentActivities,
        });
    } catch (err) {
        return errorPage(response, err.message);
    }
});

router.get("/profile/edit", isLoggedIn, (request, response) => {
    return response.render("user/profile-edit.ejs", {
        pageName: "Edit Profile",
        user: request.session.user,
    });
});

router.post("/profile/update", (request, response) => {
    let query = `
        UPDATE profiles
        SET displayName = ?, bio = ?, introduction = ?, profilePicture = ?
        WHERE user_id = ?`;
    let { displayName, bio, introduction, profilePicture } = request.body;
    db.run(query, [displayName, bio, introduction, profilePicture, request.session.user.id], (err) => {
        if (err) return errorPage(response, "Error while updating profile!");

        // Update session object
        request.session.user.displayName = displayName;
        request.session.user.bio = bio;
        request.session.user.introduction = introduction;
        request.session.user.profilePicture = profilePicture;

        return response.redirect("/user/profile");
    });
});

// Register
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

router.post("/register", async (request, response) => {
    let { role, username, email, password, major, year, department, title } = request.body;

    // Ensure login credentials are unique
    try {
        await db_isUniqueLoginCredentials_promise(username, email);
    } catch (err) {
        if (err.message) return errorPage(response, err.message);
        return response.render("user/register.ejs", {
            pageName: "Register",
            errors: err.errors,
            formInputStored: request.body,
        });
    }

    // 1. Insert into "users" table
    let query = "INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)";
    let params = [email, username, password, role];
    db.run(query, params, (err) => {
        if (err) return errorPage(response, "Error creating user!");

        // 2. Get latest "users.id" for step 3 and 4
        query = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
        params = [username, email, password];
        db.get(query, params, (err, existingUser) => {
            if (err) return errorPage(response, "Error searching for user!");
            if (!existingUser) return errorPage(response, "You do not have an account!");

            // 3. Insert into "students" or "educators" table
            if (role == "student") {
                query = "INSERT INTO students (user_id, major, year) VALUES (?, ?, ?)";
                param = [existingUser.id, major, year];
            }
            if (role == "educator") {
                query = "INSERT INTO educators (user_id, department, title) VALUES (?, ?, ?)";
                param = [existingUser.id, department, title];
            }
            db.run(query, param, (err) => {
                if (err) return errorPage(response, "Error assigning role!");

                // 4. Insert into "profiles" table
                query = `
                    INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture)
                    VALUES (?, ?, ?, ?, ?)`;
                params = [
                    // Format
                    existingUser.id,
                    username,
                    `Hi there, I'm ${existingUser.username} and this is my bio!`,
                    `Hi there, I'm ${existingUser.username} and this is my introduction!`,
                    "user.png",
                ];
                db.run(query, params, (err) => {
                    if (err) return errorPage(response, "Error creating profile!");

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

// Handle invalid URLs (eg. "/user/*")
router.get("/*", (request, response) => {
    return response.redirect("/user/profile?error=invalid_url");
});

module.exports = router;
