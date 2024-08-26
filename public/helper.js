const { db } = require("./db.js");

function errorPage(response, errorMessage) {
    response.render("_error.ejs", { errorMessage: errorMessage });
}

function isLoggedIn(request, response, next) {
    if (request.session.user) return response.redirect("/user/profile?error=already_logged_in");
    next();
}

function isNotLoggedIn(request, response, next) {
    if (!request.session.user) return response.redirect("/user/login?error=not_logged_in");
    next();
}

function isAlreadyEnrolledIntoCourse(request, response, next) {
    request.session.cart.forEach((item) => {
        let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
        let params = [request.session.user.id, item.id];
        db.get(query, params, (err, existingEnrollment) => {
            if (err) return errorPage(response, "Database error!");
            if (existingEnrollment) return response.redirect("/checkout?error=already_enrolled");
            next();
        });
    });
}

function insertEnrollment(request, response, next) {
    request.session.cart.forEach((item) => {
        let query = "INSERT INTO enrollments (user_id, course_id, enrollment_date) VALUES (?, ?, CURRENT_TIMESTAMP)";
        let params = [request.session.user.id, item.id];
        db.get(query, params, (err) => {
            if (err) return errorPage(response, "Database error!");
            next();
        });
    });
}

// Export module containing the following so external files can access it
module.exports = {
    errorPage,
    isLoggedIn,
    isNotLoggedIn,
    isAlreadyEnrolledIntoCourse,
    insertEnrollment,
};
