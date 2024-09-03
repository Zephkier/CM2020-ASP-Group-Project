// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // Format
    return_twoDecimalPlaces,
    return_validPictureFilename,
    return_formattedNumber,
    errorPage,
    db_isEnrolledInCourse_promise,
    db_getCourse_promise,
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs have "/courses" prefix!

// Home (Courses)
router.get("/", async (request, response) => {
    /**
     * If user logged in, then check if user has enrolled into any courses,
     * so that text displays either price or "Already Enrolled".
     * But it takes time to complete the query.
     * Thus, must use "async" above and Promise() below.
     */

    // Await for promised query result
    let coursesPromised = await new Promise((resolve) => {
        db.all("SELECT * FROM courses", (err, courses) => {
            if (err) return errorPage(response, "Error retrieving courses!");
            if (!courses) return errorPage(response, "No courses found!");
            return resolve(courses);
        });
    });

    let sortOption = request.query.sort || "popular";
    if (sortOption === "popular") coursesPromised.sort((a, b) => b.enrollCount - a.enrollCount);
    else if (sortOption === "asc") coursesPromised.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === "desc") coursesPromised.sort((a, b) => b.name.localeCompare(a.name));

    let coursesPromisedEdited = [];
    try {
        // Await for all promised query results in map() loop
        coursesPromisedEdited = await Promise.all(
            coursesPromised.map(async (course) => {
                // Format properties
                course.price = return_twoDecimalPlaces(course.price);
                course.picture = return_validPictureFilename("./public/images/courses/", course.name);
                course.enrollCount = return_formattedNumber(course.enrollCount);

                // Await for promised query result
                if (request.session.user) course = await db_isEnrolledInCourse_promise(request.session.user.id, course.id, course);
                else course.isEnrolled = false;

                return course;
            })
        );
    } catch (error) {
        return errorPage(response, error.message);
    }

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
    let course = await db_getCourse_promise(courseId, response);

    // Set "course" properties
    course.price = return_twoDecimalPlaces(course.price);
    course.picture = return_validPictureFilename("./public/images/courses/", course.name);

    // Await for promised query result
    try {
        course = await db_isEnrolledInCourse_promise(userId, courseId, course);
    } catch (error) {
        return errorPage(response, error.message);
    }

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
router.post("/:courseId/enroll", async (request, response) => {
    let courseId = request.params.courseId;

    // If "session.cart" object does not exist, then create one (this also prevents object from refreshing upon every enroll)
    if (!request.session.cart) request.session.cart = [];

    // Check if course is already in cart
    let cart = request.session.cart;
    let courseExists = cart.find((item) => item.id == courseId);
    if (courseExists) return response.redirect(`/courses?error=${courseExists.name}_already_in_cart`);

    // Push current course into "cart"
    let course = await db_getCourse_promise(courseId, response);
    cart.push(course);

    // Update "session.cart" object with latest "cart"
    request.session.cart = cart;

    return response.redirect("/cart");
});

// Handle invalid URLs (eg. "/courses/*")
router.get("/*", (request, response) => {
    return response.redirect("/courses?error=invalid_url");
});

module.exports = router;
