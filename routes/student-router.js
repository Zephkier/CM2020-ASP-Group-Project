// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // General helper functions
    errorPage,
    return_twoDecimalPlaces,
    return_validPictureFilename,
    hasRoles,
    isLoggedIn,
    // Database-related helper functions
    db_isEnrolledInCourse,
    db_insertIntoEnrollments,
    db_updateEnrollCount,
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
        item.picture = return_validPictureFilename("./public/images/courses/", item.name);
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

router.post("/checkout/applepay", (request, response, next) => {
    // 1. Out of scope: Handle Apple Paypayment, and ensure it is successful

    // 2. Update database, delete/clear cart, redirect to updated profile page
    db_insertIntoEnrollments(request, response, next);
    db_updateEnrollCount(request, response, next);

    delete request.session.cart;
    return response.redirect("/user/profile?payment_success_applepay");
});

router.post("/checkout/creditcard", (request, response, next) => {
    // 1. Out of scope: Handle Credit Card payment, and ensure it is successful

    // 2. Update database, delete/clear cart, redirect to updated profile page
    db_insertIntoEnrollments(request, response, next);
    db_updateEnrollCount(request, response, next);

    delete request.session.cart;
    return response.redirect("/user/profile?payment_success_creditcard");
});

// Learn
router.get("/learn/course/:courseId", isLoggedIn, hasRoles(["student"]), db_isEnrolledInCourse, (request, response, next) => {
    let userId = request.session.user.id;
    let courseId = request.params.courseId;
    let topicId = request.query.topicId || 1; // Default to topic 1

    // Get selected course
    db.get("SELECT * FROM courses WHERE id = ?", [courseId], (err, course) => {
        if (err) return errorPage(response, "Error retrieving course to learn!");
        if (!course) return errorPage(response, "Course not found!");

        // Get topics belonging to selected course
        db.all("SELECT * FROM topics WHERE course_id = ?", [courseId], (err, topics) => {
            if (err) return errorPage(response, "Error retrieving topics!");
            if (!topics) return errorPage(response, "No topics found for this course!");

            // Find selected topic, default to topic 1
            let selectedTopic = topics.find((topic) => topic.id == topicId) || topics[0];

            // In event that educator did not add any topics
            if (!selectedTopic) return response.redirect(`/courses/${courseId}?error=no_topics_yet`);

            // Change its ".video_url" property into embed version URL
            selectedTopic.video_url = selectedTopic.video_url.replace("watch?v=", "embed/");

            // Get notes belonging to selected course and user
            db.all("SELECT * FROM notes WHERE course_id = ? AND user_id = ?", [courseId, userId], (err, notes) => {
                if (err) return errorPage(response, "Error retrieving notes!");
                if (!notes) return errorPage(response, "Notes not found!");

                // Default to an empty array if no notes are found
                course.notes = notes || [];

                return response.render("student/course-learn.ejs", {
                    pageName: `Learn: ${course.name}`,
                    course: course,
                    topics: topics,
                    selectedTopic: selectedTopic,
                    user: request.session.user,
                });
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

    let query = "INSERT INTO notes (user_id, course_id, content) VALUES (?, ?, ?)";
    db.run(query, [userId, courseId, content], (err) => {
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
            query = `
                UPDATE notes
                SET content = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`;
            db.run(query, [content, existingNote.id], (err) => {
                if (err) return errorPage(response, "Error updating note!");
                return response.redirect(`/student/learn/course/${courseId}`);
            });
        } else {
            // Insert a new note
            query = `
                INSERT INTO notes (user_id, course_id, content)
                VALUES (?, ?, ?)`;
            db.run(query, [userId, courseId, content], (err) => {
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
    let query = `
        UPDATE notes
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
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

// Handle invalid URLs (eg. "/student/*")
router.get("/*", (request, response) => {
    return response.redirect("/?error=invalid_url");
});

module.exports = router;
