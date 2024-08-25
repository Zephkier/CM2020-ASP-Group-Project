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

// Route to handle course enrollment
router.post("/enroll", (request, response) => {
    if (!request.session.user) {
        return response.redirect("/login");
    }

    const userId = request.session.user.userId;
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
    if (!request.session.user) {
        return response.redirect("/login");
    }

    const userId = request.session.user.userId;
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

router.post("/login", (request, response) => {
    const { usernameOrEmail, password } = request.body;

    // Ensure user exists in the database
    let query = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
    let params = [usernameOrEmail, usernameOrEmail, password];
    db.get(query, params, (err, existingUser) => {
        if (err) {
            console.error("Database error:", err.message);
            return response.render("login.ejs", { pageName: "Login", errorMessage: "Database error" });
        }
        if (!existingUser) return response.render("login.ejs", { pageName: "Login", errorMessage: "Invalid login credentials" });

        // At this point, the user exists in the database
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
            // Handle case where profile is missing
            if (!userInfo) return response.render("login.ejs", { pageName: "Login", errorMessage: "Profile not found. Please complete your registration." });
            // Store user info in session
            request.session.user = userInfo;

            // Redirect to profile after successful login
            return response.redirect("/profile");
        });
    });
});

router.get("/logout", (request, response) => {
    request.session.destroy();
    return response.redirect("/");
});

// Register
router.get("/register", (request, response) => {
    return response.render("register.ejs", {
        pageName: "Register",
    });
});

// Register new user
router.post("/register", (req, res) => {
    const { role, username, email, password, major, year, department, title } = req.body;

    // Check if the email already exists
    db.get("SELECT * FROM users WHERE email = ?", [email], (err, existingUser) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send("Database error");
        }
        if (existingUser) {
            return res.render("register.ejs", {
                pageName: "Register",
                errors: { email: "This email is already registered." },
                formData: { username, email, major, year, department, title },
            });
        }
        // Proceed with registration if email does not exist
        db.run("INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)", [email, username, password, role], function (error) {
            if (error) {
                console.error("Database error inserting user:", error.message);
                return res.status(500).send("Database error");
            }

            const userId = this.lastID;

            // Insert into the appropriate table based on the role
            if (role === "student") {
                let query = "INSERT INTO students (user_id, major, year) VALUES (?, ?, ?)";
                let params = [userId, major || "Not enrolled", year || 0];
                db.run(query, params, (error) => {
                    if (error) {
                        console.error("Database error inserting student:", error.message);
                        return res.status(500).send("Database error");
                    }
                });
            } else if (role === "educator") {
                let query = "INSERT INTO educators (user_id, department, title) VALUES (?, ?, ?)";
                let params = [userId, department || "No department", title || "No title"];
                db.run(query, params, (error) => {
                    if (error) {
                        console.error("Database error inserting educator:", error.message);
                        return res.status(500).send("Database error");
                    }
                });
            }

            // Create profile for new user
            let query = "INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (?, ?, ?, ?, ?)";
            let params = [userId, username, "Hi there, this is my bio!", "Hi there, this is my introduction!", "dog.png"];
            db.run(query, params, (error) => {
                if (error) {
                    console.error("Database error inserting profile:", error.message);
                    return res.status(500).send("Database error");
                }
                return res.redirect("/login");
            });
        });
    });
});

// Profile
router.get("/profile", (request, response) => {
    if (!request.session.user) return response.redirect("/login");

    // Fetch user profile information and enrolled courses
    db.all(
        `
        SELECT courses.name, courses.description
        FROM enrollments
        JOIN courses ON enrollments.course_id = courses.id
        WHERE enrollments.user_id = ?`,
        [request.session.user.userId],
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
                    username: request.session.user.username,
                    bio: request.session.user.bio,
                    introduction: request.session.user.introduction,
                    displayName: request.session.user.displayName,
                    enrolledCourses: enrolledCourses,
                },
            });
        }
    );
});

router.get("/edit-profile", (request, response) => {
    response.render("edit-profile", {
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
        if (err) {
            console.error("Database error updating profile:", err.message);
            return response.status(500).send("Database error");
        }

        // Update the session data with the new values
        request.session.user.displayName = displayName;
        request.session.user.bio = bio;
        request.session.user.introduction = introduction;
        request.session.user.profilePicture = profilePicture;

        // Redirect back to the profile page
        response.redirect("/profile");
    });
});

module.exports = router;
