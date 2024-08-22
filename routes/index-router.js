// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");

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

    return response.render("profile.ejs", {
        pageName: "My Profile",
        user: {
            username: request.session.username,
            bio: request.session.bio,
            introduction: request.session.introduction,
            displayName: request.session.displayName,
        },
    });
});

// Route - handle user login
router.post("/login", (request, response) => {
    const { usernameOrEmail, password } = request.body;

    db.get("SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?", [usernameOrEmail, usernameOrEmail, password], (err, row) => {
        if (err) {
            console.error("Database error:", err.message);
            return response.render("login.ejs", { pageName: "Login", errorMessage: "Database error" });
        }

        if (!row) return response.render("login.ejs", { pageName: "Login", errorMessage: "Invalid username/email or password" });

        db.get("SELECT bio, introduction, displayName FROM user_profiles WHERE user_id = ?", [row.user_id], (err, profile) => {
            if (err) {
                console.error("Database error:", err.message);
                return response.render("login.ejs", { pageName: "Login", errorMessage: "Database error" });
            } else {
                request.session.authenticated = true;
                request.session.username = row.username;
                request.session.userId = row.user_id;
                request.session.bio = profile ? profile.bio : "No bio available.";
                request.session.introduction = profile ? profile.introduction : "No introduction available.";
                request.session.displayName = profile ? profile.displayName : row.username;
                return response.redirect("/profile");
            }
        });
    });
});

// Login page route (GET)
router.get("/login", (request, response) => {
    return response.render("login.ejs", {
        pageName: "Login",
        errorMessage: null,
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
