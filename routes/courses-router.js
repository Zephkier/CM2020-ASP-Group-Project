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
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs has "/courses" prefix!

// Home (Courses)
router.get("/", async (request, response) => {
    // Promise to complete query, then store in "courses"
    let promisedCourses = await new Promise((resolve, reject) => {
        db.all("SELECT * FROM courses", (err, courses) => {
            if (err) return reject("Error retrieving courses from the database!");
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
     * 1. setPictureAndPriceProperties() of each course
     * 2. Complete query for ".isEnrolled" property to differentiate price to display price itself or "Already Enrolled"
     *
     * Then store in "enrollmentPromises"
     */
    let promisedProperties = promisedCourses.map((course) => {
        return new Promise((resolve, reject) => {
            setPictureAndPriceProperties(course);
            if (request.session.user) {
                let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
                let params = [request.session.user.id, course.id];
                db.get(query, params, (err, existingEnrollment) => {
                    if (err) reject("Error checking enrollment for a course!");
                    if (existingEnrollment) course.isEnrolled = true;
                    else course.isEnrolled = false;
                    resolve();
                });
            } else {
                course.isEnrolled = false;
                resolve();
            }
        });
    });

    // Wait for all promises to complete
    await Promise.all(promisedProperties);
    return response.render("courses/courses.ejs", {
        pageName: "Courses",
        courses: promisedCourses,
        sort: sortOption,
    });
});

// Courses: Upon choosing a course
router.get("/course/:courseId", (request, response) => {
    db.get("SELECT * FROM courses WHERE id = ?", [request.params.courseId], (err, course) => {
        if (err) return errorPage(response, "Database error when retrieving chosen course information!");
        if (!course) return errorPage(response, "No chosen course to view!");

        setPictureAndPriceProperties(course);

        // If user is logged in, then differentiate button to display "Add to Cart" or "Already Enrolled"
        if (request.session.user) {
            let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
            let params = [request.session.user.id, request.params.courseId];
            db.get(query, params, (err, existingEnrollment) => {
                if (err) return errorPage(response, "Database error when retrieving enrollment information!");
                if (existingEnrollment) course.isEnrolled = true;
                else course.isEnrolled = false;
                // Unfortunately, have to "return response.render()" the same thing twice
                return response.render("courses/course.ejs", {
                    pageName: `Learn ${course.name}`,
                    course: course,
                });
            });
        } else {
            // Must use "else" statement
            // Unfortunately, have to "return response.render()" the same thing twice
            return response.render("courses/course.ejs", {
                pageName: `Learn ${course.name}`,
                course: course,
            });
        }
    });
});

// Courses: Upon choosing a course, then clicking "Add to Cart" (aka enroll)
router.post("/course/:courseId/enroll", (request, response) => {
    let courseId = request.params.courseId;

    // If "session.cart" object does not exist, then create one (this also prevents object from refreshing upon every enroll)
    if (!request.session.cart) request.session.cart = [];

    // Check if course is already in cart
    let cart = request.session.cart;
    let courseExists = cart.find((item) => item.id == courseId);
    if (courseExists) return response.redirect(`/courses/cart?error=${courseExists.name}_already_in_cart`);

    // If course is not in cart, then "cart.push()" and redirect to cart page
    db.get("SELECT * FROM courses WHERE id = ?", [courseId], (err, course) => {
        if (err) return errorPage(response, "Database error when retrieving chosen course information!");
        if (!course) return errorPage(response, "No chosen course to add to cart!");

        // Push into "cart", update "session.cart" object with latest "cart"
        cart.push(course);
        request.session.cart = cart;
        return response.redirect("/courses/cart");
    });
});

// Cart
router.get("/cart", (request, response) => {
    let totalPrice = 0;
    let cart = request.session.cart || [];

    cart.forEach((item) => {
        setPictureAndPriceProperties(item);
        // Calculate "totalPrice"
        totalPrice += parseFloat(item.price);
    });

    // Set ".totalPrice" property to 2 decimal places to properly display price
    totalPrice = parseFloat(totalPrice).toFixed(2);

    return response.render("courses/cart.ejs", {
        pageName: "Cart",
        cart: cart,
        totalPrice: totalPrice,
    });
});

router.post("/cart/remove", (request, response) => {
    let cart = request.session.cart || [];

    // Filter out item with "courseId" from EJS' "<input name='courseId'>"
    cart = cart.filter((item) => item.id !== parseInt(request.body.courseId, 10));

    // Update the session cart
    request.session.cart = cart;

    // Redirect back to the cart page
    return response.redirect("/courses/cart");
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
    delete request.session.cart;
    response.redirect("/user/profile");
});

// Checkout: Payment and database update (same as Apple Pay method)
router.post("/checkout/creditcard", db_isNewCoursesOnly, (request, response, next) => {
    // 1. Ensure cart contains new courses only (done by helper function)

    // 2. Out of scope: Handle Credit Card payment, and ensure it is successful

    // 3. Update database, delete/clear cart, redirect to updated profile page
    db_insertIntoEnrollments(request, response, next);
    delete request.session.cart;
    response.redirect("/user/profile");
});

module.exports = router;
