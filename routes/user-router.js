// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // Format
    errorPage,
    isLoggedIn,
    isNotLoggedIn,
    setPictureAndPriceProperties,
    db_isExistingUser,
    db_forProfile_getProfileInfo,
    db_forProfile_getEnrolledCourses,
    db_isUnique_usernameAndEmail,
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs has "/user" prefix!

// Home (Profile)
router.get("/", (request, response) => {
    return response.redirect("/user/profile");
});

// Login
router.get("/login", (request, response) => {
    if (request.session.user) return response.redirect("/user/profile?error=already_logged_in");

    return response.render("user/login.ejs", {
        pageName: "Login",
        usernameOrEmailStored: null,
        errorMessage: null,
    });
});

router.post("/login", db_isExistingUser, db_forProfile_getProfileInfo, (request, response) => {
    // This is for when not-logged-in users checkout their cart
    // Thus, upon login, redirect to checkout page
    if (request.session.cart) return response.redirect("/courses/checkout");

    // But under normal circumstances (eg. login normally), redirect to profile page
    return response.redirect("/user/profile");
});

// Profile
router.get("/profile", isLoggedIn, db_forProfile_getEnrolledCourses, (request, response) => {
    // Add ".picture" property so it can be displayed
    request.session.user.enrolledCourses.forEach((enrolledCourse) => {
        setPictureAndPriceProperties(enrolledCourse);
    });

    // Check user role and render appropriate profile page
    if (request.session.user.role === "student") {
        // Render student profile
        return response.render("user/profile.ejs", {
            pageName: "Student Profile",
            user: request.session.user,
        });
    } else if (request.session.user.role === "educator") {
        // Render educator profile
        return response.render("user/educator_profile.ejs", {
            pageName: "Educator Profile",
            user: request.session.user,
        });
    } else {
        // Handle unexpected roles
        return errorPage(response, "Role not recognized!");
    }
});

router.get("/profile/edit", (request, response) => {
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

router.post("/register", db_isUnique_usernameAndEmail, (request, response) => {
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

// -------------Adding new course (educator)---------------

// Fetch teaching courses for an educator
function db_forProfile_getTeachingCourses(educatorId, callback) {
    let query = `
        SELECT courses.id, courses.name, courses.description, courses.picture
        FROM courses
        JOIN educators ON educators.id = courses.id
        WHERE educators.user_id = ?`;

    db.all(query, [educatorId], (err, courses) => {
        if (err) return callback(err);
        callback(null, courses || []);
    });
}

// Route to show form to add a new course
router.get('/add-course', isLoggedIn, (req, res) => {
    res.render('user/add_course.ejs', {
        pageName: 'Add New Course',
        appName: 'Educator Platform',
        user: req.session.user
    });
});

// Route to handle form submission to add a new course
router.post('/add-course', isLoggedIn, (req, res) => {
    const { name, description, price, enrollCount, video_url } = req.body;
    const creator = req.session.user.username;

    const query = `
        INSERT INTO courses (name, description, price, enrollCount, video_url, creator)
        VALUES (?, ?, ?, 0, ?, ?)`;
    const params = [name, description, parseFloat(price), video_url, creator];

    db.run(query, params, (err) => {
        if (err) return errorPage(res, 'Database error while adding the course!');
        res.redirect('/user/profile'); // Redirect to the educator's profile page
    });
});

// Handle invalid URLs (eg. "/user/*")
router.get("/*", (request, response) => {
    return response.redirect("/user/profile?error=invalid_url");
});

module.exports = router;
