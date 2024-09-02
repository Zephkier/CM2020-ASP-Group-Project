// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // Format
    return_twoDecimalPlaces,
    return_validPictureFilename,
    return_formattedNumber,
    errorPage,
    db_getSpecificCourse,
    db_getIsEnrolled_forSpecificUserAndCourse,
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs have "/courses" prefix!

// Home (Courses)
router.get("/", async (request, response) => {
    // If user logged in, then check if user has enrolled into any courses
    // So that text displays either price or "Already Enrolled"
    // But it takes time to complete this query, thus, must use Promise()

    // Get all courses
    let coursesPromised = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM courses", (err, courses) => {
            if (err) return reject("Error retrieving all courses!");
            if (!courses) return reject("No courses found!");
            resolve(courses);
        });
    });

    // Sort all courses
    let sortOption = request.query.sort || "popular";
    if (sortOption == "popular") coursesPromised.sort((a, b) => b.enrollCount - a.enrollCount);
    else if (sortOption == "asc") coursesPromised.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption == "desc") coursesPromised.sort((a, b) => b.name.localeCompare(a.name));

    /**
     * 1. Set every course's ".price/picture/enrollCount" property
     * 2. Set every course's ".isEnrolled" property to differentiate text to display either price or "Already Enrolled"
     */
    let coursesPromisedEdited = coursesPromised.map((course) => {
        return new Promise((resolve, reject) => {
            course.price = return_twoDecimalPlaces(course.price);
            course.picture = return_validPictureFilename("./public/images/courses/", course.name);
            course.enrollCount = return_formattedNumber(course.enrollCount);
            if (request.session.user) {
                // If logged in, then differentiate text to display either price or "Already Enrolled"
                let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
                let params = [request.session.user.id, course.id];
                db.get(query, params, (err, existingEnrollment) => {
                    if (err) reject("Error checking student's enrollment for this course!");
                    existingEnrollment ? (course.isEnrolled = true) : (course.isEnrolled = false);
                    resolve(course);
                });
            } else {
                // If not logged in, then just display price
                course.isEnrolled = false;
                resolve(course);
            }
        });
    });

    // Wait for query to complete
    coursesPromisedEdited = await Promise.all(coursesPromisedEdited);

    return response.render("courses/courses.ejs", {
        pageName: "Courses",
        courses: coursesPromisedEdited,
        sort: sortOption,
    });
});

// Individual course
router.get("/:courseId", async (request, response) => {
    let userId = request.session.user ? request.session.user.id : null;
    let courseId = request.params.courseId;

    // Await for promised query result
    let course = await db_getSpecificCourse(courseId);

    // Set "course" properties
    course.price = return_twoDecimalPlaces(course.price);
    course.picture = return_validPictureFilename("./public/images/courses/", course.name);

    // Await for promised query result
    course = await db_getIsEnrolled_forSpecificUserAndCourse(userId, courseId, course);

    let query = "SELECT * FROM topics WHERE course_id = ? LIMIT 3";
    db.all(query, [courseId], (err, topics) => {
        if (err) return errorPage(response, "Error retrieving course topics!");
        if (!topics) return errorPage(response, "Course topics not found!");

        course.topics = topics;
        return response.render("courses/course.ejs", {
            pageName: `About ${course.name}`,
            course: course,
        });
    });
});

// Upon clicking "Add to Cart" button
router.post("/:courseId/enroll", (request, response) => {
    let courseId = request.params.courseId;

    // If "session.cart" object does not exist, then create one (this also prevents object from refreshing upon every enroll)
    if (!request.session.cart) request.session.cart = [];

    // Check if course is already in cart
    let cart = request.session.cart;
    let courseExists = cart.find((item) => item.id == courseId);
    if (courseExists) return response.redirect(`/courses?error=${courseExists.name}_already_in_cart`);

    // If course is not in cart, then "cart.push()" and redirect to cart page
    db.get("SELECT * FROM courses WHERE id = ?", [courseId], (err, course) => {
        if (err) return errorPage(response, "Database error when retrieving chosen course information!");
        if (!course) return errorPage(response, "No chosen course to add to cart!");

        // Push into "cart", update "session.cart" object with latest "cart"
        cart.push(course);
        request.session.cart = cart;
        return response.redirect("/cart");
    });
});

// Handle invalid URLs (eg. "/courses/*")
router.get("/*", (request, response) => {
    return response.redirect("/courses?error=invalid_url");
});

module.exports = router;
