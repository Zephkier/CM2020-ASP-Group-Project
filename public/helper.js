const { db } = require("./db.js"); // For any database queries
const fs = require("fs"); // For "return_validPictureFilename()"

// ----- General helper functions ----- //

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
 * Display prices with cents.
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
 * Validate and get `filename` with its existing file type.
 *
 * @param {string} pathToPicture
 * Directory path containing `filename`. Must end with "/"! *(eg. "./public/images/courses/")*
 *
 * @param {string} filename
 * File to validate. Must exclude its file type! *(eg. "C Sharp")*
 *
 * @returns
 * `filename` with its type at the end *(eg. "C Sharp.jpg")*
 */
function return_validPictureFilename(pathToPicture, filename) {
    if (fs.existsSync(`${pathToPicture}${filename}.jpeg`)) return `${filename}.jpeg`;
    if (fs.existsSync(`${pathToPicture}${filename}.jpg`)) return `${filename}.jpg`;
    if (fs.existsSync(`${pathToPicture}${filename}.png`)) return `${filename}.png`;
    return false;
}

/**
 * Format long numbers with commas every 3 digits.
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
 * Check `roles` against `request.session.user.role`:
 * - If match, then proceed.
 * - If does not match, then return error page.
 *
 * @param {array} roles
 * Array of strings *(eg. ["student", "educator"])*.
 */
function hasRoles(roles) {
    return function (request, response, next) {
        if (roles.includes(request.session.user.role)) return next();
        else return response.redirect("/user/profile?error=no_permission");
    };
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

// ----- Database-related helper functions ----- //

/**
 * Create `new Promise()` to get limited number of courses, ordered from most to least `enrollCount`.
 *
 * - If query succeeds, then `resolve(popularCourses)`
 * - If query fails, then `reject([])`
 *
 * Actual query:
 * - `SELECT * FROM courses`
 * - `ORDER BY enrollCount DESC`
 * - `LIMIT ?`
 *
 * @param {integer} limit Number of courses to return.
 *
 * @returns Query result in `request.topFewCourses`
 */
function db_getLimitedPopularCourses_promise(limit) {
    return new Promise((resolve, reject) => {
        let query = "SELECT * FROM courses ORDER BY enrollCount DESC LIMIT ?";
        db.all(query, [limit], (err, popularCourses) => {
            if (err) return reject("Error retrieving popular courses!");
            if (!popularCourses) return reject("No popular courses found!");
            return resolve(popularCourses);
        });
    });
}

/**
 * Create `new Promise()` to get specific course based on its ID.
 *
 * - If query succeeds, then `resolve(course)`
 * - If query fails, then return error page.
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
 * Check if user is enrolled into a course.
 *
 * - If user is enrolled, then proceed.
 * - If user is not enrolled, then return error page.
 *
 * Actual query:
 * - `SELECT * FROM enrollments`
 * - `WHERE user_id = [request.session.user.id] AND course_id = [request.params.courseId]`
 */
function db_isEnrolledInCourse(request, response, next) {
    let query = "SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?";
    let params = [request.session.user.id, request.params.courseId];
    db.get(query, params, (err, existingEnrollment) => {
        if (err) return errorPage(response, "Error retrieving enrollment information!");
        if (existingEnrollment) return next();
        else return response.redirect("/user/profile?error=not_enrolled");
    });
}

/**
 * Create `new Promise()` to check if user is enrolled into a course.
 *
 * - If user is enrolled, then return `object` with additional `.isEnrolled = true` property.
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
            if (err) return reject("Error checking if user is enrolled into courses!");
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

/**
 * Create `new Promise()` to get user's reent activities.
 *
 * - If there is matching `notes/enrollments.user_id`, then return query result.
 * - If there is no matching `notes/enrollments.user_id`, then return new `Error()`
 *
 * Actual query is huge, in brief:
 * - Queries `notes`, `enrollments`, and `courses` tables.
 */
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

/**
 * Create `new Promise()` to get user's enrolled courses.
 *
 * - If there is matching `enrollments.user_id`, then return query result.
 * - If there is no matching `enrollments.user_id`, then return new `Error()`
 *
 * Actual query is huge, in brief:
 * - Queries `courses` and `enrollments` tables.
 * - Matches `enrollments.user_id = ?`
 */
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

/**
 * Create `new Promise()` to get user's created courses with latest one first.
 *
 * - If there is matching `courses.creator_id`, then return query result.
 * - If there is no matching `courses.creator_id`, then return new `Error()`
 *
 * Actual query:
 * - `SELECT * FROM courses`
 * - `WHERE creator_id = ?`
 * - `ORDER BY courses.id DESC`
 */
function db_getProfileCreatedCourses_promise(userId) {
    return new Promise((resolve, reject) => {
        let query = "SELECT * FROM courses WHERE creator_id = ? ORDER BY courses.id DESC";
        db.all(query, [userId], (err, courses) => {
            if (err) return reject(new Error("Error retrieving created courses!"));
            return resolve(courses || []);
        });
    });
}

/**
 * Create `new Promise()` to ensure both `username` and `email` are unique.
 *
 * - If both are unique, then proceed.
 * - If either are not unique, then return new `Error()` containing `errors.username/email` (or both).
 *
 * Actual queries:
 * - `SELECT * FROM users WHERE username = ?`
 * - `SELECT * FROM users WHERE email = ?`
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

/**
 * For `student-router.js' .post("/checkout")` route.
 *
 * - If query succeeds, then proceed.
 * - If query fails, then return error page.
 *
 * Actual query:
 * - `INSERT INTO enrollments (user_id, course_id)`
 * - `VALUES (?, ?)`
 */
function db_insertIntoEnrollments(request, response, next) {
    request.session.cart.forEach((item) => {
        let query = "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)";
        let params = [request.session.user.id, item.id];
        db.get(query, params, (err) => {
            if (err) return errorPage(response, "Error adding enrollments!");
            return next();
        });
    });
}

/**
 * For `student-router.js' .post("/checkout")` route.
 *
 * - If query succeeds, then proceed.
 * - If query fails, then return error page.
 *
 * Actual query:
 * - `UPDATE courses`
 * - `SET enrollCount = enrollCount + 1`
 * - `WHERE id = ?`
 */
function db_updateEnrollCount(request, response, next) {
    request.session.cart.forEach((item) => {
        let query = "UPDATE courses SET enrollCount = enrollCount + 1 WHERE id = ?";
        db.run(query, [item.id], (err) => {
            if (err) return errorPage(response, "Error updating enrollment count!");
            return next();
        });
    });
}

/**
 * For `educator-router.js' .post("/update/course")` route.
 *
 * This covers both inserting new and updating existing topics.
 * - If query succeeds, then proceed.
 * - If query fails, then return error page.
 *
 * Actual queries:
 * - `INSERT INTO topics (course_id, name, description, video_url)`
 * - `VALUES (?, ?, ?, ?)`
 *
 * And
 *
 * - `UPDATE topics`
 * - `SET name = ?, description = ?, video_url = ?`
 * - `WHERE course_id = ? AND id = ?`
 */
function db_processTopics(request, courseId) {
    // Handle new topics (insert them)
    if (request.body.newTopics) {
        let newTopics = request.body.newTopics;
        Object.keys(newTopics).forEach((index) => {
            let query = "INSERT INTO topics (course_id, name, description, video_url) VALUES (?, ?, ?, ?)";
            let { name, description, video_url } = newTopics[index];
            db.run(query, [courseId, name, description, video_url], (err) => {
                if (err) console.log("Error adding new topic: ", err);
            });
        });
    }

    // Handle existing topics (update them)
    if (request.body.existingTopics) {
        let existingTopics = request.body.existingTopics;
        Object.keys(existingTopics).forEach((index) => {
            let query = "UPDATE topics SET name = ?, description = ?, video_url = ? WHERE course_id = ? AND id = ?";
            let { name, description, video_url } = existingTopics[index];
            db.run(query, [name, description, video_url, courseId, index], (err) => {
                if (err) console.log("Error updating topic: ", err);
            });
        });
    }
}

// Export module containing the following so external files can access it
module.exports = {
    // General helper functions
    errorPage,
    return_twoDecimalPlaces,
    return_validPictureFilename,
    return_formattedNumber,
    hasRoles,
    isLoggedIn,
    isNotLoggedIn,
    // Database-related helper functions
    db_getLimitedPopularCourses_promise,
    db_getCourse_promise,
    db_isEnrolledInCourse,
    db_isEnrolledInCourse_promise,
    db_isExistingUser_promise,
    db_getProfileInfo_promise,
    db_getProfileRecentActivities_promise,
    db_getProfileEnrolledCourses_promise,
    db_getProfileCreatedCourses_promise,
    db_isUniqueLoginCredentials_promise,
    db_insertIntoEnrollments,
    db_updateEnrollCount,
    db_processTopics,
};
