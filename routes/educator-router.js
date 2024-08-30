// Import and setup modules
const express = require("express");
const multer = require("multer");
const {
    // Format
    errorPage,
    isLoggedIn,
} = require("../public/helper.js");
// Initialise router
const router = express.Router();

// Note that all these URLs has "/educator" prefix!

// Home (NIL)
router.get("/", (request, response) => {
    return response.send("Educator home");
});

/// Dumped

// Configure multer for file uploads
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/images/courses/");
    },
    filename: function (req, file, cb) {
        let ext = file.mimetype.split("/")[1];
        cb(null, `${req.body.name}.${ext}`);
    },
});

let upload = multer({ storage: storage });

// Route to show form to add a new course
router.get("/add-course", isLoggedIn, (req, res) => {
    return res.render("user/add_course.ejs", {
        pageName: "Add New Course",
        user: req.session.user,
        formInputStored: {},
    });
});

// Route to show form to add a new course
router.get("/add-course/edit/:courseId", isLoggedIn, (req, res) => {
    db.get("SELECT * FROM courses WHERE id = ?", [req.params.courseId], (err, course) => {
        if (err) return errorPage(res, "Database error when retrieving course details!");
        if (!course) return errorPage(res, "Course not found!");
        console.log(req.session);
        return res.render("user/add_course.ejs", {
            pageName: "Edit Course",
            user: req.session.user,
            formInputStored: course,
        });
    });
});

// Route to handle form submission to add a new course
router.post("/add-course", isLoggedIn, upload.single("picture"), (req, res) => {
    let { name, description, price, video_url } = req.body;
    let picture = req.file ? req.file.filename : null; // Get the uploaded file name

    let query = `
        INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture)
        VALUES (?, ?, ?, ?, 0, ?, ?)`;
    let params = [req.session.user.id, name, description, parseFloat(price), video_url, picture];
    db.run(query, params, (err) => {
        if (err) return errorPage(res, "Database error while adding the course!");
        return res.redirect("/user/profile");
    });
});

///

// Handle invalid URLs (eg. "/user/*")
router.get("/*", (request, response) => {
    return response.redirect("/?error=invalid_url");
});

module.exports = router;
