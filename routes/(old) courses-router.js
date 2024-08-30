// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // Format
    errorPage,
    isLoggedIn,
    setPictureAndPriceProperties,
    db_isNewCoursesOnly,
    db_insertIntoEnrollments,
    db_updateEnrollCount,
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs has "/courses" prefix!

// TODO move to helper.js
/**
 * Ensure user is enrolled into a course so they can rightfully access the "learn" page
 */
function db_isEnrolledIntoCourse(request, response, next) {
    let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
    let params = [request.session.user.id, request.params.courseId];
    db.get(query, params, (err, existingEnrollment) => {
        if (err) return errorPage(response, "Database error when retrieving enrollment information!");
        if (existingEnrollment) next();
        else return errorPage(response, "You are not enrolled into this course!");
    });
}

// Courses: In profile page, select course to learn
router.get("/course/:courseId/learn", isLoggedIn, db_isEnrolledIntoCourse, (req, res) => {
    const courseId = req.params.courseId;
    const userId = req.session.user.id;

    // Fetch course details
    db.get("SELECT * FROM courses WHERE id = ?", [courseId], (err, course) => {
        if (err) return errorPage(res, "Database error when retrieving course details!");
        if (!course) return errorPage(res, "Course not found!");

        setPictureAndPriceProperties(course);

        // Change "courses.video_url" into embed version
        course.video_url = course.video_url.replace("watch?v=", "embed/");

        // Fetch all notes related to the course for the current user
        db.all("SELECT * FROM notes WHERE course_id = ? AND user_id = ?", [courseId, userId], (err, notes) => {
            if (err) return errorPage(res, "Database error when retrieving notes!");

            // Assign notes array to the course
            course.notes = notes || []; // Default to an empty array if no notes are found

            // Render the course detail page with the course and notes data
            res.render("courses/course_detail.ejs", {
                pageName: `Learn: ${course.name}`,
                course: course,
                user: req.session.user,
            });
        });
    });
});

// Route to add a new note
router.post("/course/:courseId/notes", (req, res) => {
    const userId = req.session.user.id;
    const courseId = req.params.courseId;
    const content = req.body.content.trim(); // Trim to avoid empty content issues

    // Check if the content is not empty
    if (!content) {
        return res.redirect(`/courses/course/${courseId}/learn?error=empty_note`);
    }

    const insertQuery = "INSERT INTO notes (user_id, course_id, content) VALUES (?, ?, ?)";
    db.run(insertQuery, [userId, courseId, content], (err) => {
        if (err) {
            console.error("Database error saving note:", err); // Log the error
            return errorPage(res, "Database error saving note!");
        }
        res.redirect(`/courses/course/${courseId}/learn`);
    });
});

// Route to edit a note
router.post("/course/:courseId/notes/:noteId/edit", isLoggedIn, (req, res) => {
    const { noteId, courseId } = req.params;
    const { content } = req.body;

    const query = "UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(query, [content, noteId], (err) => {
        if (err) return errorPage(res, "Database error updating note!");
        res.redirect(`/courses/course/${courseId}/learn`);
    });
});

// Route to delete a note
router.post("/course/:courseId/notes/:noteId/delete", isLoggedIn, (req, res) => {
    const { noteId, courseId } = req.params;

    const query = "DELETE FROM notes WHERE id = ?";
    db.run(query, [noteId], (err) => {
        if (err) return errorPage(res, "Database error deleting note!");
        res.redirect(`/courses/course/${courseId}/learn`);
    });
});

// Courses: Save notes
router.post("/course/:courseId/notes", isLoggedIn, (req, res) => {
    let userId = req.session.user.id;
    let courseId = req.params.courseId;
    let content = req.body.content;

    // Query to check if note already exists for the user and course
    let query = "SELECT * FROM notes WHERE user_id = ? AND course_id = ?";
    db.get(query, [userId, courseId], (err, existingNote) => {
        if (err) return errorPage(res, "Database error!");

        if (existingNote) {
            // Update the existing note
            let updateQuery = "UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            db.run(updateQuery, [content, existingNote.id], (err) => {
                if (err) return errorPage(res, "Database error updating note!");
                res.redirect(`/courses/course/${courseId}/learn`);
            });
        } else {
            // Insert a new note
            let insertQuery = "INSERT INTO notes (user_id, course_id, content) VALUES (?, ?, ?)";
            db.run(insertQuery, [userId, courseId, content], (err) => {
                if (err) return errorPage(res, "Database error saving note!");
                res.redirect(`/courses/course/${courseId}/learn`);
            });
        }
    });
});

// Checkout: Ensure user is logged in
router.get("/checkout", isLoggedIn, (request, response) => {
    let totalPrice = 0;
    let cart = request.session.cart || [];

    // If cart is empty, then user cannot access checkout page
    if (cart.length == 0) return response.redirect("/courses/cart?error=empty_checkout");

    cart.forEach((item) => {
        setPictureAndPriceProperties(item);
        // Calculate "totalPrice"
        totalPrice += parseFloat(item.price);
    });

    // Set ".totalPrice" property to 2 decimal places to properly display price
    totalPrice = parseFloat(totalPrice).toFixed(2);

    return response.render("courses/checkout.ejs", {
        pageName: "Checkout",
        cart: cart,
        totalPrice: totalPrice,
        user: request.session.user,
    });
});

// Checkout: Payment and database update (same as Credit Card method)
router.post("/checkout/applepay", db_isNewCoursesOnly, (request, response, next) => {
    // 1. Ensure cart contains new courses only (done by helper function)

    // 2. Out of scope: Handle Apple Paypayment, and ensure it is successful

    // 3. Update database, delete/clear cart, redirect to updated profile page
    db_insertIntoEnrollments(request, response, next);
    db_updateEnrollCount(request, response, next);

    delete request.session.cart;
    response.redirect("/user/profile");
});

// Checkout: Payment and database update (same as Apple Pay method)
router.post("/checkout/creditcard", db_isNewCoursesOnly, (request, response, next) => {
    // 1. Ensure cart contains new courses only (done by helper function)

    // 2. Out of scope: Handle Credit Card payment, and ensure it is successful

    // 3. Update database, delete/clear cart, redirect to updated profile page
    db_insertIntoEnrollments(request, response, next);
    db_updateEnrollCount(request, response, next);

    delete request.session.cart;
    response.redirect("/user/profile");
});

// Route to update time spent on a course
router.post("/course/:courseId/update-time", (req, res) => {
    const userId = req.session.user.id;
    const courseId = req.params.courseId;
    const { timeSpent } = req.body;

    const query = "UPDATE enrollments SET time_spent = time_spent + ? WHERE user_id = ? AND course_id = ?";
    db.run(query, [timeSpent, userId, courseId], (err) => {
        if (err) return errorPage(res, "Database error while updating time spent!");

        res.json({ success: true });
    });
});

// Handle invalid URLs (eg. "/courses/*")
router.get("/*", (request, response) => {
    return response.redirect("/courses?error=invalid_url");
});

module.exports = router;
