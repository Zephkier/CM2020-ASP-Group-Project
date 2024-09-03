// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // General helper functions
    errorPage,
    isLoggedIn,
    // Database-related helper functions
    db_processTopics,
} = require("../public/helper.js");

// Configure multer for file uploads
const multer = require("multer");
let storage = multer.diskStorage({
    destination: function (request, file, cb) {
        cb(null, "./public/images/courses/");
    },
    filename: function (request, file, cb) {
        cb(null, `${request.body.name}.${file.mimetype.split("/")[1]}`);
    },
});
let upload = multer({ storage: storage });

// Initialise router
const router = express.Router();

// Note that all these URLs have "/educator" prefix!

// Home (Profile)
router.get("/", (request, response) => {
    return response.redirect("/user/profile");
});

let categories = ["Web Development", "Programming", "Game Development", "Data Science", "Design", "Others"];

// Add course
router.get("/add/course", isLoggedIn, (request, response) => {
    return response.render("educator/course-edit.ejs", {
        pageName: "Add Course",
        user: request.session.user,
        formInputStored: {},
        categories: categories,
    });
});

// Edit course
router.get("/edit/course/:courseId", isLoggedIn, (request, response) => {
    db.get("SELECT * FROM courses WHERE id = ?", [request.params.courseId], (err, course) => {
        if (err) return errorPage(response, "Error retrieving course details!");
        if (!course) return errorPage(response, "Course not found!");

        db.all("SELECT * FROM topics WHERE course_id = ?", [request.params.courseId], (err, topics) => {
            if (err) return errorPage(response, "Error retrieving course topics!");
            if (!topics) return errorPage(response, "Course topics not found!");

            return response.render("educator/course-edit.ejs", {
                pageName: "Edit Course",
                user: request.session.user,
                formInputStored: {
                    ...course,
                    topics: topics,
                },
                categories: categories,
            });
        });
    });
});

// Submit form for both "add" and "edit" course (thus, "?" means it is optional "courseId")
router.post("/update/course/:courseId?", isLoggedIn, upload.single("picture"), (request, response) => {
    let { category, name, description, price, video_url, button } = request.body;
    let picture = request.file ? request.file.filename : null; // Get the uploaded file name

    if (button == "add") {
        let query = `
            INSERT INTO courses (creator_id, category, name, description, price, picture)
            VALUES (?, ?, ?, ?, ?, ?)`;
        let params = [request.session.user.id, category, name, description, parseFloat(price), picture];
        db.run(query, params, (err) => {
            if (err) return errorPage(response, "Error adding course!");

            let courseId = this.lastID;
            db_processTopics(request, courseId);
            return response.redirect("/user/profile");
        });
    }

    if (button == "update") {
        let query = `
            UPDATE courses
            SET category = ?, name = ?, description = ?, price = CAST(? AS DECIMAL (10, 2)), picture = ?
            WHERE id = ?`;
        let params = [category, name, description, parseFloat(price), picture, request.params.courseId];
        db.run(query, params, (err) => {
            if (err) return errorPage(response, "Error updating course!");

            db_processTopics(request, request.params.courseId);
            return response.redirect("/user/profile");
        });
    }
});

// Handle invalid URLs (eg. "/user/*")
router.get("/*", (request, response) => {
    return response.redirect("/?error=invalid_url");
});

module.exports = router;
