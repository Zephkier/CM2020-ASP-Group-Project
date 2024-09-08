// Import and setup modules
const express = require("express");
const fs = require("fs"); // Import fs to manage file operations
const { db } = require("../public/db.js");
const {
    errorPage,
    hasRoles,
    isLoggedIn,
    db_processTopics,
    return_validPictureFilename
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
router.get("/", hasRoles(["educator"]), (request, response) => {
    return response.redirect("/user/profile");
});

let categories = ["Web Development", "Programming", "Game Development", "Data Science", "Design", "Others"];

// Add course
router.get("/add/course", isLoggedIn, hasRoles(["educator"]), (request, response) => {
    return response.render("educator/course-edit.ejs", {
        pageName: "Add Course",
        user: request.session.user,
        formInputStored: {},
        categories: categories,
    });
});

// Edit course
router.get("/edit/course/:courseId", isLoggedIn, hasRoles(["educator"]), (request, response) => {
    let query = "SELECT * FROM courses WHERE id = ? AND creator_id = ?";
    let params = [request.params.courseId, request.session.user.id];
    db.get(query, params, (err, course) => {
        if (err) return errorPage(response, "Error retrieving course details!");
        if (!course) return response.redirect("/user/profile?error=no_permission");

        // Determine the current picture filename or use default if exists
        let currentPicture = course.picture || return_validPictureFilename("./public/images/courses/", course.name);

        db.all("SELECT * FROM topics WHERE course_id = ?", [request.params.courseId], (err, topics) => {
            if (err) return errorPage(response, "Error retrieving course topics!");
            if (!topics) return errorPage(response, "Course topics not found!");

            return response.render("educator/course-edit.ejs", {
                pageName: "Edit Course",
                user: request.session.user,
                formInputStored: {
                    ...course,
                    picture: currentPicture, // Pass the existing or default picture
                    topics: topics,
                },
                categories: categories,
            });
        });
    });
});

// Submit form for both "add" and "edit" course (thus, "?" means it is optional "courseId")
router.post("/update/course/:courseId?", isLoggedIn, upload.single("picture"), (request, response) => {
    let { category, name, description, price, video_url, button, existingPicture } = request.body;
    let picture = request.file ? request.file.filename : existingPicture; // Use new upload or keep the existing one

    // If updating an existing course, handle image deletion and replacement
    if (button === "update") {
        if (request.file) {
            // If a new image is uploaded, delete the existing one if it exists
            const existingImagePath = `./public/images/courses/${existingPicture}`;
            if (fs.existsSync(existingImagePath)) {
                fs.unlinkSync(existingImagePath); // Delete the old image
            }
        }

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
    } else if (button === "add") {
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
});

// Handle invalid URLs (eg. "/educator/*")
router.get("/*", (request, response) => {
    return response.redirect("/?error=invalid_url");
});

module.exports = router;
