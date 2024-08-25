// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");

// Initialise router
const router = express.Router();

// Note that all these URLs has no prefix!

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

// 'Buy now' route
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

module.exports = router;
