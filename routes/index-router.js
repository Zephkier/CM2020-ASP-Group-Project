// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");

// Initialize router
const router = express.Router();

/**
 * Useful notes to reference throughout implementation!
 *
 * =========================
 * Express functions:
 * -------------------------
 * app.get()/router.get() = the endpoint with prefix, if any
 * response.render()      = looks into 'views' dir for a matching file name to load
 * response.redirect()    = the endpoint without prefix
 *
 * =========================
 * Forms and accessibility:
 * -------------------------
 * <* name="someName"> is used as variable name for routing in .js
 *
 * <form action="endpointHere"> must match with .js .post("endpointHere") function
 * <label for="matchingName"> selects <input id="matchingName">, this helps with accessibility
 *
 * <button name="whatIsYourName"> returns its <button value="theName">
 *
 * =========================
 * Linking URLs and source files:
 * -------------------------
 * <a href=""> = the endpoint with prefix, if any
 * <a href=""> only does GET requests
 *
 * Whenever a source file is referenced (eg. css' <link href=""> / url() / <img src=""> / <script src="">),
 * Express looks into 'public' dir for a matching file name to load
 *
 * This is set in index.js via "express.static()"
 *
 * =========================
 */

// Home
router.get("/", (request, response) => {
    db.all("SELECT * FROM courses ORDER BY enrollCount DESC LIMIT 3", (err, topCourses) => {
        if (err) return console.error("Database error:", err.message);
        if (!topCourses) return console.error("No courses found!");

        return response.render("index.ejs", {
            pageName: "Home",
            topCourses: topCourses,
        });
    });
});

// About
router.get("/about", (request, response) => {
    return response.render("about.ejs", {
        pageName: "About",
    });
});

// Courses
router.get("/courses", (request, response) => {
    db.all("SELECT * FROM courses", (err, allCourses) => {
        if (err) return console.error("Database error:", err.message);
        if (!allCourses) return console.error("No courses found!");

        let sortOption = request.query.sort || "popular";
        if (sortOption === "popular") allCourses.sort((a, b) => b.enrollCount - a.enrollCount);
        else if (sortOption === "asc") allCourses.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortOption === "desc") allCourses.sort((a, b) => b.name.localeCompare(a.name));

        return response.render("courses.ejs", {
            pageName: "Courses",
            allCourses: allCourses,
            sort: sortOption,
        });
    });
});

// (Individual) Course
router.get("/courses/course/:courseId", (request, response) => {
    db.get("SELECT * FROM courses WHERE id = ?", [request.params.courseId], (err, chosenCourse) => {
        if (err) return console.error("Database error:", err.message);
        if (!chosenCourse) return console.error("No chosen course!");
        return response.render("course.ejs", {
            pageName: "Course",
            chosenCourse: chosenCourse,
        });
    });
});

// Contact
router.get("/contact", (request, response) => {
    return response.render("contact.ejs", {
        pageName: "Contact",
    });
});

// Profile
router.get("/profile", (request, response) => {
    if (!request.session || !request.session.authenticated) {
        return response.redirect("/login");
    }

    const userId = request.session.userId;

    // Fetch user profile information and enrolled courses
    db.all(
        `
        SELECT courses.name, courses.description
        FROM enrollments
        JOIN courses ON enrollments.course_id = courses.id
        WHERE enrollments.user_id = ?
    `,
        [userId],
        (err, enrolledCourses) => {
            if (err) {
                console.error("Database error:", err.message);
                return response.status(500).send("Database error");
            }

            // Ensure enrolledCourses is always defined as an array
            enrolledCourses = enrolledCourses || [];

            response.render("profile.ejs", {
                pageName: "My Profile",
                user: {
                    username: request.session.username,
                    bio: request.session.bio,
                    introduction: request.session.introduction,
                    displayName: request.session.displayName,
                    enrolledCourses: enrolledCourses,
                },
            });
        }
    );
});

// Route to handle course enrollment
router.post("/enroll", (request, response) => {
    if (!request.session || !request.session.authenticated) {
        return response.redirect("/login");
    }

    const userId = request.session.userId;
    const courseId = request.body.courseId;

    // Insert into the enrollments table
    db.run("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", [userId, courseId], function (error) {
        if (error) {
            console.error("Database error:", error);
            return response.status(500).send("Database error");
        }

        response.redirect("/profile");
    });
});

// Buy Now route
router.post("/buy-course", (request, response) => {
    if (!request.session || !request.session.authenticated) {
        return response.redirect("/login");
    }

    const userId = request.session.userId;
    const courseId = request.body.courseId;

    // Insert into the enrollments table
    db.run("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", [userId, courseId], function (error) {
        if (error) {
            console.error("Database error:", error);
            return response.status(500).send("Database error");
        }

        response.redirect("/profile");
    });
});

// Login
router.get("/login", (request, response) => {
    return response.render("login.ejs", {
        pageName: "Login",
        errorMessage: null,
    });
});

/// Login - submitting form
router.post("/login", (request, response) => {
    const { usernameOrEmail, password } = request.body;

    // Ensure user exists in database
    let query = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
    let params = [usernameOrEmail, usernameOrEmail, password];
    db.get(query, params, (err, existingUser) => {
        if (err) {
            console.error("Database error:", err.message);
            return response.render("login.ejs", { pageName: "Login", errorMessage: "Database error" });
        }
        if (!existingUser) return response.render("login.ejs", { pageName: "Login", errorMessage: "Invalid login credentials" });

        // At this point, user does indeed exist in the database
        let profileQuery = `
        SELECT *
        FROM profiles JOIN users
        ON profiles.user_id = users.id
        WHERE profiles.user_id = ?`;

        db.get(profileQuery, [existingUser.id], (err, userInfo) => {
            if (err) {
                console.error("Database error:", err.message);
                return response.render("login.ejs", { pageName: "Login", errorMessage: "Database error" });
            }

            // Store user info in session
            request.session.authenticated = true;
            request.session.userId = existingUser.id;
            request.session.username = existingUser.username;
            request.session.bio = userInfo.bio;
            request.session.introduction = userInfo.introduction;
            request.session.displayName = userInfo.displayName;

            // Redirect to profile after successful login
            return response.redirect("/profile");
        });
    });
});

// Handle GET request for the register page
router.get("/register", (request, response) => {
    return response.render("register.ejs", {
        pageName: "Register",
    });
});

// Register new user
router.post("/register", (req, res) => {
    const { role, username, email, password, major, year, department, title } = req.body;

    db.run("INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)", [email, username, password, role], function (error) {
        if (error) {
            console.error(error);
            return res.status(500).send("Database error");
        }

        const userId = this.lastID;

        if (role === "student") {
            db.run("INSERT INTO students (user_id, major, year) VALUES (?, ?, ?)", [userId, major || "Not Enrolled", year || 0], (error) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send("Database error");
                }
                return res.redirect("/login");
            });
        } else if (role === "educator") {
            db.run("INSERT INTO educators (user_id, department, title) VALUES (?, ?, ?)", [userId, department || "No Department", title || "No Title"], (error) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send("Database error");
                }
                return res.redirect("/login");
            });
        }
    });
});

// Handle user logout
router.post("/logout", (req, res) => {
    // Destroy the session to log the user out
    req.session.destroy((err) => {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).send("An error occurred while logging out");
        }
        // Redirect to the login page after successful logout
        res.redirect("/login");
    });
});

// Cart
router.get("/cart", (request, response) => {
    return response.render("cart.ejs", {
        pageName: "Cart",
    });
});

// Search
router.get("/search", (request, response) => {
    const query = request.query.q;
    if (!query) return response.redirect("/");

    return response.render("search.ejs", {
        pageName: "Search",
        query: query,
    });
});

module.exports = router;
