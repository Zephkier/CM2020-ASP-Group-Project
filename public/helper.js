const { db } = require("./db.js"); // For any database queries
const fs = require("fs"); // For "returnFilenameWithType()"

function errorPage(response, errorMessage) {
    response.render("_error.ejs", { errorMessage: errorMessage });
}

function isLoggedIn(request, response, next) {
    if (request.session.user) return response.redirect("/user/profile?error=already_logged_in");
    next();
}

function ensureLoggedIn(request, response, next) {
    if (!request.session.user) return response.redirect("/user/login?error=not_logged_in");
    next();
}

/**
 * Determine if picture filename uses `.jpg` or `.png`, then return existing one.
 *
 * Course names _(eg. `C Sharp`)_ == picture filenames _(eg. `C Sharp.jpg`)_
 *
 * @param {string} pathToPicture The path to directory containing target filename.
 * @param {string} filename The target filename itself, excluding its file type!
 * @returns The filename with either `.jpg` or `.png` at the end.
 */
function returnFilenameWithType(pathToPicture, filename) {
    if (fs.existsSync(`${pathToPicture}${filename}.jpg`)) return `${filename}.jpg`;
    if (fs.existsSync(`${pathToPicture}${filename}.png`)) return `${filename}.png`;
    return `File does not exist at: ${pathToPicture}`;
}

/**
 * `.picture` property:
 * - Contains filename with its type at the end.
 *   - _eg. `C Sharp.jpg`_
 * - Added to the object.
 *
 * `.price` property:
 * - Set to 2 decimal places to properly display price.
 *   - _eg. `1.5` becomes `1.50`_
 *
 * @param {object} course The object after querying database.
 */
function setPictureAndPriceProperties(course) {
    course.picture = returnFilenameWithType("./public/images/courses/", course.name);
    course.price = parseFloat(course.price).toFixed(2);
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
    ensureLoggedIn,
    returnFilenameWithType,
    setPictureAndPriceProperties,
    isAlreadyEnrolledIntoCourse,
    insertEnrollment,
};
