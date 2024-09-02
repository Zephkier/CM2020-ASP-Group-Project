// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const multer = require("multer");
const {
    // Format
    errorPage,
    isLoggedIn,
} = require("../public/helper.js");

// Configure multer for file uploads
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

// Add course
router.get("/add/course", isLoggedIn, (request, response) => {
    return response.render("educator/course-edit.ejs", {
        pageName: "Add Course",
        user: request.session.user,
        formInputStored: {},
    });
});

// Edit course
router.get("/edit/course/:courseId", isLoggedIn, (request, response) => {
    db.get("SELECT * FROM courses WHERE id = ?", [request.params.courseId], (err, course) => {
        if (err) return errorPage(response, "Error retrieving course details!");
        if (!course) return errorPage(response, "Course not found!");
        return response.render("educator/course-edit.ejs", {
            pageName: "Edit Course",
            user: request.session.user,
            formInputStored: course,
        });
    });
});

// Submit form for both "add" (without "/:courseId") and "edit" (with "/:courseId"), thus "?" at the end indicates that it is optional
router.post("/update/course/:courseId?", isLoggedIn, upload.single("picture"), (request, response) => {
    let { name, description, price, video_url } = request.body;
    let picture = request.file ? request.file.filename : null; // Get the uploaded file name

    if (request.body.button == "add") {
        let query = `
            INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category)
            VALUES (?, ?, ?, ?, 0, ?, ?, ?)`;
        let params = [
            request.session.user.id,
            name,
            description,
            parseFloat(price),
            video_url,
            picture,
            request.body.category, // Include the category from the form
        ];
        db.run(query, params, (err) => {
            if (err) return errorPage(response, "Error adding course!");
            return response.redirect("/user/profile");
        });
    }

    if (request.body.button == "update") {
        let query = `
            UPDATE courses
            SET name = ?, description = ?, price = CAST(? AS DECIMAL (10, 2)), video_url = ?, picture = ?
            WHERE id = ?`;
        let params = [name, description, parseFloat(price), video_url, picture, request.params.courseId];
        db.run(query, params, (err) => {
            if (err) return errorPage(response, "Error updating course!");
            return response.redirect("/user/profile");
        });
    }
});

// Handle invalid URLs (eg. "/user/*")
router.get("/*", (request, response) => {
    return response.redirect("/?error=invalid_url");
});

module.exports = router;
