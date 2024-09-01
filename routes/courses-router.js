// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const {
    // Format
    errorPage,
    setPriceProperty,
    setPictureProperty,
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs have "/courses" prefix!

// Home (Courses)
router.get("/", async (request, response) => {
    // Promise to complete query, then store in "courses"
    let promisedCourses = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM courses", (err, courses) => {
            if (err) return reject("Error retrieving all courses!");
            if (!courses) return reject("No courses found!");
            resolve(courses);
        });
    });

    let sortOption = request.query.sort || "popular";
    if (sortOption === "popular") promisedCourses.sort((a, b) => b.enrollCount - a.enrollCount);
    else if (sortOption === "asc") promisedCourses.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === "desc") promisedCourses.sort((a, b) => b.name.localeCompare(a.name));

    /**
     * Promise to:
     * 1. Set each course's price and picture properties
     * 2. Complete query for ".isEnrolled" property to differentiate price to display price itself or "Already Enrolled"
     *
     * Then store in "enrollmentPromises"
     */
    let promisedCoursesWithEditedProperties = promisedCourses.map((course) => {
        return new Promise((resolve, reject) => {
            setPriceProperty(course);
            setPictureProperty(course);
            if (request.session.user) {
                let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
                let params = [request.session.user.id, course.id];
                db.get(query, params, (err, existingEnrollment) => {
                    if (err) reject("Error checking student's enrollment for this course!");
                    existingEnrollment ? (course.isEnrolled = true) : (course.isEnrolled = false); // TEST
                    resolve(course);
                });
            } else {
                course.isEnrolled = false;
                resolve(course);
            }
        });
    });

    // Wait for all promises to complete
    await Promise.all(promisedCoursesWithEditedProperties);

    return response.render("courses/courses.ejs", {
        pageName: "Courses",
        courses: promisedCourses,
        sort: sortOption,
    });
});

// Individual course
router.get("/:courseId", (request, response) => {
    db.get("SELECT * FROM courses WHERE id = ?", [request.params.courseId], (err, course) => {
        if (err) return errorPage(response, "Error retrieving course selected!");
        if (!course) return errorPage(response, "No course selected!");

        setPriceProperty(course);

        // Differentiate "Add to Cart" or "Already enrolled" button
        if (request.session.user) {
            let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
            let params = [request.session.user.id, request.params.courseId];
            db.get(query, params, (err, existingEnrollment) => {
                if (err) return errorPage(response, "Error retrieving enrollment information!");
                existingEnrollment ? (course.isEnrolled = true) : (course.isEnrolled = false);
                // Must "return response.render()" the same thing twice
                return response.render("courses/course.ejs", {
                    pageName: `${course.name}`,
                    course: course,
                });
            });
        } else {
            // Must use "else" statement
            // Must "return response.render()" the same thing twice
            return response.render("courses/course.ejs", {
                pageName: `${course.name}`,
                course: course,
            });
        }
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
