// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // Format
    errorPage,
    isLoggedIn,
    isNotLoggedIn,
    setPriceProperty,
    setPictureProperty,
    db_isExistingUser,
    db_forProfile_getProfileInfo,
    db_forProfile_getEnrolledCourses,
    db_forProfile_getCreatedCourses,
    db_isUnique_usernameAndEmail,
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

router.post("/login", db_isExistingUser, db_forProfile_getProfileInfo, (request, response) => {
    // This is for when not-logged-in users checkout their cart
    // Thus, upon login, redirect to checkout page
    if (request.session.cart) return response.redirect("/student/checkout");

    // But under normal circumstances (eg. login normally), redirect to profile page
    return response.redirect("/user/profile");
});

// Profile
router.get("/profile", isLoggedIn, db_forProfile_getEnrolledCourses, db_forProfile_getCreatedCourses, (request, response) => {
    let userId = request.session.user.id;

    // Fetch recent activities (notes and enrollments)
    let query = `
        SELECT 'Note Added' AS activityType, content AS description, created_at AS activityDate
        FROM notes
        WHERE user_id = ?
        UNION
        SELECT 'Enrolled in Course' AS activityType, courses.name AS description, enrollment_date AS activityDate
        FROM enrollments JOIN courses
        ON enrollments.course_id = courses.id
        WHERE enrollments.user_id = ?
        ORDER BY activityDate DESC
        LIMIT 5`;
    db.all(query, [userId, userId], (err, recentActivities) => {
        if (err) return errorPage(response, "Error retrieving recent activities!");
        if (!recentActivities) return errorPage(response, "You have no recent activities!");

        db.get("SELECT * FROM profiles WHERE user_id = ?", [userId], (err, profile) => {
            if (err) return errorPage(response, "Error retrieving profile details!");
            if (!profile) return errorPage(response, "Profile not found!");

            // TEST helper functions makes this redundant
            // Students = enrolled courses and its progress
            if (request.session.user.role == "student") {
                query = `
                    SELECT courses.*, enrollments.progress 
                    FROM courses JOIN enrollments
                    ON courses.id = enrollments.course_id 
                    WHERE enrollments.user_id = ?
                    ORDER BY enrollments.enrollment_date DESC`;
                db.all(query, [userId], (err, enrolledCourses) => {
                    if (err) return errorPage(response, "Error retrieving enrolled courses!");
                    if (!enrolledCourses) return errorPage(response, "You have no enrolled courses!");

                    profile.enrolledCourses = enrolledCourses || [];
                    profile.enrolledCourses.forEach((course) => {
                        setPriceProperty(course);
                        setPictureProperty(course);
                    });

                    return response.render("user/profile.ejs", {
                        pageName: "Student Profile",
                        user: request.session.user,
                        profile: profile,
                        recentActivities: recentActivities || [],
                    });
                });
            }

            // TEST helper functions makes this redundant
            if (request.session.user.role == "educator") {
                // Educators = created courses
                db.all("SELECT * FROM courses WHERE creator_id = ? ORDER BY courses.id DESC", [userId], (err, createdCourses) => {
                    if (err) return errorPage(response, "Error retrieving created courses!");
                    if (!createdCourses) return errorPage(response, "You have no created courses!");

                    console.log(createdCourses); // FIXME not in DESC order

                    profile.createdCourses = createdCourses || [];
                    profile.createdCourses.forEach((course) => {
                        setPriceProperty(course);
                        setPictureProperty(course);
                    });

                    return response.render("user/profile.ejs", {
                        pageName: "Educator Profile",
                        user: request.session.user,
                        profile: profile,
                        recentActivities: recentActivities || [],
                    });
                });
            }
        });
    });
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
        if (err) return errorPage(response, "Database error while updating profile!");

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

router.post("/register", db_isUnique_usernameAndEmail, (request, response) => {
    let { role, username, email, password, major, year, department, title } = request.body;

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
            } else if (role == "educator") {
                query = "INSERT INTO educators (user_id, department, title) VALUES (?, ?, ?)";
                param = [existingUser.id, department, title];
            }
            db.run(query, param, (err) => {
                if (err) return errorPage(response, "Error assigning role!");

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
