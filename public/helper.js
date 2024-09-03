const { db } = require("./db.js"); // For any database queries
const fs = require("fs"); // For "return_validPictureFilename()"

// ----- General Helper Functions ----- //

/**
 * To display prices with cents.
 *
 * @param {*} number
 * Number without zeroes at the end *(eg. 1.5 or 1)*
 *
 * @returns
 * Number with 2 decimal places *(eg. 1.50 or 1.00)*
 */
function return_twoDecimalPlaces(number) {
    return parseFloat(number).toFixed(2);
}

/**
 * To validate and get `filename` with its existing file type.
 *
 * @param {string} pathToPicture
 * Directory path containing `filename`. Must end with "/"! *(eg. "./public/images/courses/")*
 *
 * @param {string} filename
 * File to validate. Must exclude its file type! *(eg. "C Sharp")*
 *
 * @returns
 * `filename` with either `.jpg` or `.png` at the end *(eg. "C Sharp.jpg")*
 */
function return_validPictureFilename(pathToPicture, filename) {
    if (fs.existsSync(`${pathToPicture}${filename}.jpg`)) return `${filename}.jpg`;
    if (fs.existsSync(`${pathToPicture}${filename}.png`)) return `${filename}.png`;
    return false;
}

/**
 * To format long numbers with commas every 3 digits.
 *
 * @param {*} number
 * Number without any formatting *(eg. 10000)*
 *
 * @returns
 * Number with formatting *(eg. 10,000)*
 */
function return_formattedNumber(number) {
    return number.toLocaleString();
}

/**
 * Render error page with custom error message.
 *
 * For security reasons, do not reveal explicit details!
 *
 * @param {string} errorMessage
 * Message to inform user, and for us to identify what went wrong.
 */
function errorPage(response, errorMessage) {
    response.render("partials/error.ejs", { errorMessage: errorMessage });
}

/**
 * If user is logged in, then proceed.
 *
 * If user is not logged in, then redirect to login page with error message.
 */
function isLoggedIn(request, response, next) {
    if (request.session.user) return next();
    return response.redirect("/user/login?error=not_logged_in");
}

/**
 * If user is not logged in, then proceed.
 *
 * If user is logged in, then redirect to profile page with error message.
 */
function isNotLoggedIn(request, response, next) {
    if (!request.session.user) return next();
    return response.redirect("/user/profile?error=already_logged_in");
}

// ----- Database-related Helper Functions ----- //

/**
 * Get limited number of courses, ordered by enroll count from most to least.
 *
 * Actual query:
 * - `SELECT * FROM courses`
 * - `ORDER BY enrollCount DESC`
 * - `LIMIT ?`
 *
 * @param {*} limit Number of courses to return.
 *
 * @returns Query result in `request.topFewCourses`
 */
function db_getCoursesLimited(limit) {
    return (request, response, next) => {
        db.all("SELECT * FROM courses ORDER BY enrollCount DESC LIMIT ?", [limit], (err, topFewCourses) => {
            if (err) return errorPage(response, "Error retrieving top courses!");
            if (!topFewCourses) return errorPage(response, "No courses found!");
            request.topFewCourses = topFewCourses;
            return next();
        });
    };
}

/**
 * Create `new Promise()` to get specific course based on its ID.
 *
 * Actual query:
 * - `SELECT * FROM courses WHERE id = ?`
 */
function db_getCourse_promise(courseId, response) {
    return new Promise((resolve) => {
        db.get("SELECT * FROM courses WHERE id = ?", [courseId], (err, course) => {
            if (err) return errorPage(response, "Error retrieving course selected!");
            if (!course) return errorPage(response, "No course selected!");
            return resolve(course);
        });
    });
}

/**
 * Create `new Promise()` to check if user is enrolled into a course.
 *
 * - If user is enrolled, then return `object` with additional `.isEnrolled = true` property.
 *
 * - If user is not enrolled, then return `object` with additional `.isEnrolled = false` property.
 *
 * Actual query:
 * - `SELECT * FROM enrollments`
 * - `WHERE user_id = ? AND course_id = ?`
 */
function db_isEnrolledInCourse_promise(userId, courseId, object) {
    return new Promise((resolve, reject) => {
        let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
        db.get(query, [userId, courseId], (err, existingEnrollment) => {
            if (err) return reject(new Error("Error checking if user enrolled into course!"));
            existingEnrollment ? (object.isEnrolled = true) : (object.isEnrolled = false);
            return resolve(object);
        });
    });
}

/**
 * Create `new Promise()` to check if user has existing login credentials in database.
 *
 * - If have, then return query result.
 * - If do not have, then return new `Error()`
 *
 * Actual query:
 * - `SELECT * FROM users`
 * - `WHERE (username = ? OR email = ?) AND course_id = ?`
 */
function db_isExistingUser_promise(usernameOrEmail, password) {
    return new Promise((resolve, reject) => {
        let query = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
        let params = [usernameOrEmail, usernameOrEmail, password];
        db.get(query, params, (err, existingUser) => {
            if (err) return reject(new Error("Error retrieving user credentials!"));
            if (!existingUser) return reject(new Error("Invalid login credentials"));
            return resolve(existingUser);
        });
    });
}

/**
 * Create `new Promise()` to get user's profile info.
 *
 * - If there is matching `profiles.user_id`, then return query result.
 * - If there is no matching `profiles.user_id`, then return new `Error()`
 *
 * Actual query:
 * - `SELECT *`
 * - `FROM profiles JOIN users`
 * - `ON profiles.user_id = users.id`
 * - `WHERE profiles.user_id = ?`
 */
function db_getProfileInfo_promise(userId) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT *
            FROM profiles JOIN users
            ON profiles.user_id = users.id
            WHERE profiles.user_id = ?`;
        db.get(query, [userId], (err, userProfileInfo) => {
            if (err) return reject(new Error("Error retrieving user profile!"));
            if (!userProfileInfo) return reject(new Error("Profile not found. Please contact support."));
            return resolve(userProfileInfo);
        });
    });
}

// TODO
function db_getProfileRecentActivities_promise(userId) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT
                'Note Added' AS activityType,
                content AS description,
                created_at AS activityDate
            FROM notes WHERE user_id = ?
            UNION
            SELECT
                'Enrolled in Course' AS activityType,
                courses.name AS description,
                enrollment_date AS activityDate
            FROM enrollments JOIN courses
            ON enrollments.course_id = courses.id
            WHERE enrollments.user_id = ?
            ORDER BY activityDate DESC
            LIMIT 5`;
        db.all(query, [userId, userId], (err, recentActivities) => {
            if (err) return reject(new Error("Error retrieving recent activities!"));
            return resolve(recentActivities || []);
        });
    });
}

// TODO
function db_getProfileEnrolledCourses_promise(userId) {
    return new Promise((resolve, reject) => {
        let query = `
            SELECT courses.*, enrollments.progress 
            FROM courses JOIN enrollments
            ON courses.id = enrollments.course_id 
            WHERE enrollments.user_id = ?
            ORDER BY enrollments.enrollment_date DESC`;
        db.all(query, [userId], (err, courses) => {
            if (err) return reject(new Error("Error retrieving enrolled courses!"));
            return resolve(courses || []);
        });
    });
}

// TODO
function db_getProfileCreatedCourses_promise(userId) {
    return new Promise((resolve, reject) => {
        let query = "SELECT * FROM courses WHERE creator_id = ? ORDER BY courses.id DESC";
        db.all(query, [userId], (err, courses) => {
            if (err) return reject(new Error("Error retrieving created courses!"));
            return resolve(courses || []);
        });
    });
}

// TODO
/**
 * Query `users` table to ensure both `username` and `email` are unique.
 *
 * - If **both** are unique, then proceed.
 *
 * - If **either** are not unique,
 * then `errors.username` and/or `errors.email` is created,
 * then redirect to register page with error message.
 */
function db_isUniqueLoginCredentials_promise(username, email) {
    return new Promise((resolve, reject) => {
        let errors = {};

        db.get("SELECT * FROM users WHERE username = ?", [username], (err, existingUsername) => {
            if (err) return reject({ message: "Error ensuring username is unique!" });
            if (existingUsername) errors.username = "This username has been registered.";

            db.get("SELECT * FROM users WHERE email = ?", [email], (err, existingEmail) => {
                if (err) return reject({ message: "Error ensuring email is unique!" });
                if (existingEmail) errors.email = "This email has been registered.";

                // If errors exist, reject with the errors object
                if (Object.keys(errors).length > 0) {
                    return reject({ errors });
                }
                return resolve();
            });
        });
    });
}

// ------------------------ //
// ----- Unused Below ----- //
// ------------------------ //

// TODO JSDoc string
function hasRoles(roles) {
    return function (request, response, next) {
        if (roles.includes(request.session.user.role)) return next();
        return errorPage(response, "You do not have permission to access this page!");
    };
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
        let query = "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)";
        let params = [request.session.user.id, item.id];
        db.get(query, params, (err) => {
            if (err) return errorPage(response, "Database error when adding enrollments!");
            return next();
        });
    });
}

/**
 * Query to `UPDATE courses` table's `enrollCount`.
 */
function db_updateEnrollCount(request, response, next) {
    request.session.cart.forEach((item) => {
        let query = "UPDATE courses SET enrollCount = enrollCount + 1 WHERE id = ?";
        db.run(query, [item.id], (err) => {
            if (err) return errorPage(response, "Database error when updating enrollment count!");
            return next();
        });
    });
}

/**
 * TODO JSDoc string
 * Ensure user is enrolled into a course so they can rightfully access the "learn" page
 */
function db_isEnrolledIntoCourse(request, response, next) {
    let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
    let params = [request.session.user.id, request.params.courseId];
    db.get(query, params, (err, existingEnrollment) => {
        if (err) return errorPage(response, "Database error when retrieving enrollment information!");
        if (existingEnrollment) return next();
        else return errorPage(response, "You are not enrolled into this course!");
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
        return next();
    });
}

// TODO JSDoc string
function db_forProfile_getCreatedCourses(request, response, next) {
    let query = `
        SELECT *
        FROM courses JOIN educators
        ON courses.creator_id = educators.user_id
        WHERE educators.user_id = ?`;
    db.all(query, [request.session.user.id], (err, createdCourses) => {
        if (err) return errorPage(response, "Database error when retrieving your created courses!");
        if (!createdCourses) return errorPage(response, "Something went wrong! Unable to load your created courses.");
        request.session.user.createdCourses = createdCourses || [];
        return next();
    });
}

// Export module containing the following so external files can access it
module.exports = {
    // "Used" below
    return_twoDecimalPlaces,
    return_validPictureFilename,
    return_formattedNumber,
    errorPage,
    isLoggedIn,
    isNotLoggedIn,
    // -----
    db_getCoursesLimited,
    db_getCourse_promise,
    db_isEnrolledInCourse_promise,
    db_isExistingUser_promise,
    db_getProfileInfo_promise,
    db_getProfileRecentActivities_promise,
    db_getProfileEnrolledCourses_promise,
    db_getProfileCreatedCourses_promise,
    db_isUniqueLoginCredentials_promise,

    // "Unused" below
    hasRoles,
    // -----
    db_isNewCoursesOnly,
    db_insertIntoEnrollments,
    db_updateEnrollCount,
    db_isEnrolledIntoCourse,
    db_forProfile_getEnrolledCourses,
    db_forProfile_getCreatedCourses,
};
