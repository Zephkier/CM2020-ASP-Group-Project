const { db } = require("./db.js"); // For any database queries
const fs = require("fs"); // For "returnFilenameWithType()"

function errorPage(response, errorMessage) {
    response.render("_error.ejs", { errorMessage: errorMessage });
}

/**
 * Ensure user **IS** logged in, then allowed to proceed.
 *
 * _(eg. Checks for `request.session.user`)_
 *
 * @returns
 * - If user **is** logged in, then proceed.
 * - If user **is not** logged in, then redirect to login page.
 */
function isLoggedIn(request, response, next) {
    if (request.session.user) return next();
    return response.redirect("/user/login?error=not_logged_in");
}

/**
 *
 * Ensure user **IS NOT** logged in, then allowed to proceed.
 *
 * _(eg. Checks for `!request.session.user`)_
 *
 * @returns
 * - If user **is not** logged in, then proceed.
 * - If user **is** logged in, then redirect to profile page.
 */
function isNotLoggedIn(request, response, next) {
    if (!request.session.user) return next();
    return response.redirect("/user/profile?error=already_logged_in");
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

/**
 * Ensure user is checking-out cart that contains courses that are **new to them**,
 * then allowed to proceed.
 *
 * @returns
 * - If cart contains courses that **is/are new to the user**,
 * then proceed.
 *
 * - If cart contains courses that user **is already enrolled into**,
 * then cannot checkout, and redirect to checkout page with error message.
 */
function db_isNewCoursesOnly(request, response, next) {
    request.session.cart.forEach((item) => {
        let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
        let params = [request.session.user.id, item.id];
        db.get(query, params, (err, existingEnrollment) => {
            if (err) return errorPage(response, "Database error when retrieving enrollment information!");
            if (existingEnrollment) return response.redirect("/checkout?error=already_enrolled");
            return next();
        });
    });
}

function db_insertIntoEnrollments(request, response, next) {
    request.session.cart.forEach((item) => {
        let query = "INSERT INTO enrollments (user_id, course_id, enrollment_date) VALUES (?, ?, CURRENT_TIMESTAMP)";
        let params = [request.session.user.id, item.id];
        db.get(query, params, (err) => {
            if (err) return errorPage(response, "Database error when adding enrollments!");
            return next();
        });
    });
}

/**
 * Ensure user **has** existing login credentials in database, then allowed to proceed.
 *
 * @returns
 * - If user **has** existing credentials in database,
 * then store `users` table fields into `request.session.user`, and proceed.
 *
 * - If user **does not have** existing credentials in database,
 * then redirect to login page with error message.
 */
function db_isExistingUser(request, response, next) {
    let query = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
    let params = [request.body.usernameOrEmail, request.body.usernameOrEmail, request.body.password];
    db.get(query, params, (err, existingUser) => {
        if (err) return errorPage(response, "Database error when retrieving user credentials!");
        if (!existingUser)
            return response.render("user/login.ejs", {
                pageName: "Login",
                errorMessage: "Invalid login credentials",
            });
        request.session.user = existingUser;
        return next();
    });
}

/**
 * Get user's bio, profile picture and others **for profile page**.
 *
 * @returns
 * - If user **has** profile info,
 * then store in `request.session.user` and proceed.
 *
 * - If user **does not have** profile info,
 * then redirect to login page with error message.
 */
function db_getUserInfoForProfile(request, response, next) {
    let query = `
        SELECT *
        FROM profiles JOIN users
        ON profiles.user_id = users.id
        WHERE profiles.user_id = ?`;
    db.get(query, [request.session.user.id], (err, userProfileInfo) => {
        if (err) return errorPage(response, "Database error when retrieving user profile!");
        if (!userProfileInfo)
            return response.render("user/login.ejs", {
                pageName: "Login",
                errorMessage: "Profile not found. Please complete your registration.",
            });
        request.session.user = userProfileInfo;
        return next();
    });
}

/**
 * Get user's enrolled courses **for profile page**.
 *
 * @returns
 * - If user **has** enrolled courses info,
 * then store in `request.session.user.enrolledCourses` and proceed.
 *
 * - If user **does not have** enrolled courses info,
 * then redirect to error page as database query failed.
 */
function db_getEnrolledCoursesForProfile(request, response, next) {
    let query = `
        SELECT courses.name, courses.description
        FROM enrollments JOIN courses
        ON enrollments.course_id = courses.id
        WHERE enrollments.user_id = ?`;
    db.all(query, [request.session.user.id], (err, enrolledCourses) => {
        if (err) return errorPage(response, "Database error when retrieving enrolled courses!");
        if (!enrolledCourses) return errorPage(response, "Something went wrong! Unable to load your enrolled courses.");
        request.session.user.enrolledCourses = enrolledCourses || [];
        next();
    });
}

/**
 * Ensures both `username` and `email` are unique in database, then allowed to proceed.
 *
 * @returns
 * - If both unique, then proceed.
 *
 * - If either are not unique, then redirect to register page with error message.
 */
function db_isUnique_usernameAndEmail(request, response, next) {
    let errors = {};
    db.get("SELECT * FROM users WHERE username = ?", [request.body.username], (err, existingUsername) => {
        if (err) return errorPage(response, "Database error when ensuring username is unique!");
        if (existingUsername) errors.username = "This username has been registered.";
        db.get("SELECT * FROM users WHERE email = ?", [request.body.email], (err, existingEmail) => {
            if (err) return errorPage(response, "Database error when ensuring email is unique!");
            if (existingEmail) errors.email = "This email has been registered.";
            // If "errors" have no properties/keys, then proceed
            if (Object.keys(errors).length == 0) return next();
            // If "errors" has properties/keys, then re-render register page
            return response.render("user/register.ejs", {
                pageName: "Register",
                errors: errors,
                formInputStored: request.body,
            });
        });
    });
}

// Export module containing the following so external files can access it
module.exports = {
    errorPage,
    isNotLoggedIn,
    isLoggedIn,
    returnFilenameWithType,
    setPictureAndPriceProperties,
    db_isNewCoursesOnly,
    db_insertIntoEnrollments,
    db_isExistingUser,
    db_getUserInfoForProfile,
    db_getEnrolledCoursesForProfile,
    db_isUnique_usernameAndEmail,
};
