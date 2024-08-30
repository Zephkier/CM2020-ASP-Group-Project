// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const multer = require("multer");
const {
    // Format
    errorPage,
    isLoggedIn,
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs have "/educator" prefix!

// Home (Profile)
router.get("/", (request, response) => {
    return response.redirect("/user/profile");
});

// Configure multer for file uploads
let storage = multer.diskStorage({
    destination: function (request, file, cb) {
        cb(null, "./public/images/courses/");
    },
    filename: function (request, file, cb) {
        let ext = file.mimetype.split("/")[1];
        cb(null, `${request.body.name}.${ext}`);
    },
});

let upload = multer({ storage: storage });

// Add course
router.get("/add/course", isLoggedIn, (request, response) => {
    return response.render("educator/course-edit.ejs", {
        pageName: "Add New Course",
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

// Submit form
router.post("/add/course", isLoggedIn, upload.single("picture"), (request, response) => {
    let { name, description, price, video_url } = request.body;
    let picture = request.file ? request.file.filename : null; // Get the uploaded file name

    let query = `
        INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture)
        VALUES (?, ?, ?, ?, 0, ?, ?)`;
    let params = [request.session.user.id, name, description, parseFloat(price), video_url, picture];
    db.run(query, params, (err) => {
        if (err) return errorPage(response, "Error adding/updating course!");
        return response.redirect("/user/profile");
    });
});

// Handle invalid URLs (eg. "/user/*")
router.get("/*", (request, response) => {
    return response.redirect("/?error=invalid_url");
});

module.exports = router;
