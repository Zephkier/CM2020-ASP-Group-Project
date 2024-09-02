// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // Format
    return_twoDecimalPlaces,
    return_validPictureFilename,
    errorPage,
    isLoggedIn,
    hasRoles,
    db_isNewCoursesOnly,
    db_insertIntoEnrollments,
    db_updateEnrollCount,
    db_isEnrolledIntoCourse,
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs have "/student" prefix!

// Home (Profile)
router.get("/", (request, response) => {
    return response.redirect("/user/profile");
});

// Checkout
router.get("/checkout", isLoggedIn, hasRoles(["student"]), (request, response) => {
    // If cart is empty, then user cannot access checkout page
    if (request.session.cart.length == 0) return response.redirect("/cart?error=empty_checkout");

    let totalPrice = 0;
    let cart = request.session.cart || [];
    cart.forEach((item) => {
        item.price = return_twoDecimalPlaces(item.price);
        item.picture = return_validPictureFilename("./public/images/courses", item.picture);
        totalPrice += parseFloat(item.price);
    });
    totalPrice = return_twoDecimalPlaces(totalPrice);

    return response.render("student/checkout.ejs", {
        pageName: "Checkout",
        cart: cart,
        totalPrice: totalPrice,
        user: request.session.user,
    });
});

router.post("/checkout/applepay", db_isNewCoursesOnly, (request, response, next) => {
    // 1. Ensure cart contains new courses only (done by helper function)

    // 2. Out of scope: Handle Apple Paypayment, and ensure it is successful

    // 3. Update database, delete/clear cart, redirect to updated profile page
    db_insertIntoEnrollments(request, response, next);
    db_updateEnrollCount(request, response, next);

    delete request.session.cart;
    return response.redirect("/user/profile?payment_success_applepay");
});

router.post("/checkout/creditcard", db_isNewCoursesOnly, (request, response, next) => {
    // 1. Ensure cart contains new courses only (done by helper function)

    // 2. Out of scope: Handle Credit Card payment, and ensure it is successful

    // 3. Update database, delete/clear cart, redirect to updated profile page
    db_insertIntoEnrollments(request, response, next);
    db_updateEnrollCount(request, response, next);

    delete request.session.cart;
    return response.redirect("/user/profile?payment_success_creditcard");
});

// Learn
router.get("/learn/course/:courseId", isLoggedIn, db_isEnrolledIntoCourse, (request, response) => {
    let courseId = request.params.courseId;
    let userId = request.session.user.id;

    // Get course for user to learn
    db.get("SELECT * FROM courses WHERE id = ?", [courseId], (err, course) => {
        if (err) return errorPage(response, "Error retrieving course to learn!");
        if (!course) return errorPage(response, "Course not found!");

        // Change "courses.video_url" into embed version
        course.video_url = course.video_url.replace("watch?v=", "embed/");

        // Get notes related to course for current user
        db.all("SELECT * FROM notes WHERE course_id = ? AND user_id = ?", [courseId, userId], (err, notes) => {
            if (err) return errorPage(response, "Error retrieving notes!");
            if (!notes) return errorPage(response, "Notes not found!");

            // Default to an empty array if no notes are found
            course.notes = notes || [];
            return response.render("student/course-learn.ejs", {
                pageName: `Learn: ${course.name}`,
                course: course,
                user: request.session.user,
            });
        });
    });
});

// Learn: Add new note
router.post("/learn/course/:courseId/notes", (request, response) => {
    let userId = request.session.user.id;
    let courseId = request.params.courseId;
    let content = request.body.content.trim(); // Trim to avoid empty content issues
    if (!content) return response.redirect(`/student/learn/course/${courseId}?error=empty_note`); // Ensure content is not empty

    let insertQuery = "INSERT INTO notes (user_id, course_id, content) VALUES (?, ?, ?)";
    db.run(insertQuery, [userId, courseId, content], (err) => {
        if (err) return errorPage(response, "Error saving note!");
        return response.redirect(`/student/learn/course/${courseId}`);
    });
});

// Learn: Save note
router.post("/learn/course/:courseId/notes", (request, response) => {
    let userId = request.session.user.id;
    let courseId = request.params.courseId;
    let content = request.body.content;

    // Check if note exists for the user and course
    let query = "SELECT * FROM notes WHERE user_id = ? AND course_id = ?";
    db.get(query, [userId, courseId], (err, existingNote) => {
        if (err) return errorPage(response, "Error retrieving note!");

        if (existingNote) {
            // Update the existing note
            let updateQuery = "UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            db.run(updateQuery, [content, existingNote.id], (err) => {
                if (err) return errorPage(response, "Error updating note!");
                return response.redirect(`/student/learn/course/${courseId}`);
            });
        } else {
            // Insert a new note
            let insertQuery = "INSERT INTO notes (user_id, course_id, content) VALUES (?, ?, ?)";
            db.run(insertQuery, [userId, courseId, content], (err) => {
                if (err) return errorPage(response, "Error saving note!");
                return response.redirect(`/student/learn/course/${courseId}`);
            });
        }
    });
});

// Learn: Edit note
router.post("/learn/course/:courseId/notes/:noteId/edit", (request, response) => {
    let { noteId, courseId } = request.params;
    let { content } = request.body;
    let query = "UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(query, [content, noteId], (err) => {
        if (err) return errorPage(response, "Error updating note!");
        return response.redirect(`/student/learn/course/${courseId}`);
    });
});

// Learn: Delete note
router.post("/learn/course/:courseId/notes/:noteId/delete", (request, response) => {
    let { noteId, courseId } = request.params;
    let query = "DELETE FROM notes WHERE id = ?";
    db.run(query, [noteId], (err) => {
        if (err) return errorPage(response, "Error deleting note!");
        return response.redirect(`/student/learn/course/${courseId}`);
    });
});

// Learn: Update time spent on course
router.post("/learn/course/:courseId/update-time", (request, response) => {
    let userId = request.session.user.id;
    let courseId = request.params.courseId;
    let { timeSpent } = request.body;
    let query = "UPDATE enrollments SET time_spent = time_spent + ? WHERE user_id = ? AND course_id = ?";
    db.run(query, [timeSpent, userId, courseId], (err) => {
        if (err) return errorPage(response, "Error updating time spent!");
        return response.json({ success: true });
    });
});

// Handle invalid URLs (eg. "/user/*")
router.get("/*", (request, response) => {
    return response.redirect("/?error=invalid_url");
});

module.exports = router;
