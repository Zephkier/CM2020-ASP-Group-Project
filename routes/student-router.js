// Import and setup modules
const express = require("express");
const {
    // Format
    errorPage,
    isLoggedIn,
    isNotLoggedIn,
    hasRoles,
    setPriceProperty,
    setPictureProperty,
    db_isNewCoursesOnly,
    db_insertIntoEnrollments,
    db_updateEnrollCount,
    db_isExistingUser,
    db_forProfile_getProfileInfo,
    db_forProfile_getEnrolledCourses,
    db_forProfile_getCreatedCourses,
    db_isUnique_usernameAndEmail,
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
        setPriceProperty(item);
        setPictureProperty(item);
        totalPrice += parseFloat(item.price);
    });
    totalPrice = parseFloat(totalPrice).toFixed(2); // Set "totalPrice" to 2 decimal places to properly display price

    return response.render("student/checkout.ejs", {
        pageName: "Checkout",
        cart: cart,
        totalPrice: totalPrice,
        user: request.session.user,
    });
});

// Checkout: Pay via Apple Pay
router.post("/checkout/applepay", db_isNewCoursesOnly, (request, response, next) => {
    // 1. Ensure cart contains new courses only (done by helper function)

    // 2. Out of scope: Handle Apple Paypayment, and ensure it is successful

    // 3. Update database, delete/clear cart, redirect to updated profile page
    db_insertIntoEnrollments(request, response, next);
    db_updateEnrollCount(request, response, next);

    delete request.session.cart;
    response.redirect("/user/profile");
});

// Checkout: Pay via Credit Card
router.post("/checkout/creditcard", db_isNewCoursesOnly, (request, response, next) => {
    // 1. Ensure cart contains new courses only (done by helper function)

    // 2. Out of scope: Handle Credit Card payment, and ensure it is successful

    // 3. Update database, delete/clear cart, redirect to updated profile page
    db_insertIntoEnrollments(request, response, next);
    db_updateEnrollCount(request, response, next);

    delete request.session.cart;
    response.redirect("/user/profile");
});

// Handle invalid URLs (eg. "/user/*")
router.get("/*", (request, response) => {
    return response.redirect("/?error=invalid_url");
});

module.exports = router;
