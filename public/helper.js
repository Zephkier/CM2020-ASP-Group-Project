const { db } = require("./db.js"); // For any database queries
const fs = require("fs"); // For "returnFilenameWithType()"

/**
 * Redirect to `_error.ejs` file with custom error message.
 *
 * @param {string} errorMessage The message to inform user. For security reasons, do not reveal explicit details!
 */
function errorPage(response, errorMessage) {
    response.render("_error.ejs", { errorMessage: errorMessage });
}

/**
 * Checks for `request.session.user` *(aka. if user is logged in)*.
 *
 * - If user **is** logged in, then proceed.
 * - If user **is not** logged in, then redirect to login page with error message.
 */
function isLoggedIn(request, response, next) {
    if (request.session.user) return next();
    return response.redirect("/user/login?error=not_logged_in");
}

/**
 *
 * Checks for `!request.session.user` *(aka. if user is not logged in)*.
 *
 * - If user **is not** logged in, then proceed.
 * - If user **is** logged in, then redirect to profile page with error message.
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
 * - Is added to the object.
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
 * Query to `SELECT *` from `enrollments` table.
 *
 * For each item (aka. course) within `request.session.cart`:
 *
 * - If item **does not exist** in `enrollments` table,
 * then it means that the user **is enrolling into a new** item (aka. course),
 * then proceed.
 *
 * - If item **exists** in `enrollments` table,
 * then it means that the user **is enrolling into an existing** item (aka. course),
 * then do not allow checkout,
 * then redirect to checkout page with error message.
 */
function db_isNewCoursesOnly(request, response, next) {
    request.session.cart.forEach((item) => {
        let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
        let params = [request.session.user.id, item.id];
        db.get(query, params, (err, existingEnrollment) => {
            if (err) return errorPage(response, "Database error when retrieving enrollment information!");
            if (existingEnrollment) return response.redirect("/courses/checkout?error=already_enrolled");
            return next();
        });
    });
}

/**
 * Query to `INSERT INTO enrollments` table.
 */
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
 * Query to `SELECT *` from `users` table.
 *
 * - If user **has** existing login credentials in database,
 * then store result in `request.session.user` and proceed.
 *
 * - If user **does not have** existing login credentials in database,
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
                usernameOrEmailStored: request.body.usernameOrEmail,
                errorMessage: "Invalid login credentials",
            });
        request.session.user = existingUser;
        return next();
    });
}

/**
 * Query to `SELECT *` when joining `users` and `profiles` tables.
 *
 * - If user **has** `profiles.user_id`,
 * then store result in `request.session.user` and proceed.
 *
 * - If user **does not have** `profiles.user_id`,
 * then redirect to login page with error message.
 */
function db_forProfile_getProfileInfo(request, response, next) {
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
                // "Contact support" because if registered, then profile should have been created too
                errorMessage: "Profile not found. Please contact support.",
            });
        request.session.user = userProfileInfo;
        return next();
    });
}

/**
 * Query to `SELECT *` when joining `enrollments` and `courses` tables.
 *
 * - If user **has** `enrollments.user_id`,
 * then store result in `request.session.user.enrolledCourses` and proceed.
 *
 *   - If user is not enrolled into any courses, then `[]` is stored.
 *
 * - If user **does not have** `enrollments.user_id`,
 * then redirect to error page as database query failed.
 */
function db_forProfile_getEnrolledCourses(request, response, next) {
    let query = `
        SELECT *
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
 * Query `users` table to ensure both `username` and `email` are unique.
 *
 * - If **both** are unique, then proceed.
 *
 * - If **either** are not unique,
 * then `errors.username` and/or `errors.email` is created,
 * then redirect to register page with error message.
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
    isLoggedIn,
    isNotLoggedIn,
    returnFilenameWithType,
    setPictureAndPriceProperties,
    db_isNewCoursesOnly,
    db_insertIntoEnrollments,
    db_isExistingUser,
    db_forProfile_getProfileInfo,
    db_forProfile_getEnrolledCourses,
    db_isUnique_usernameAndEmail,
};
