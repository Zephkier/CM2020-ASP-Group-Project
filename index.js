// Import and setup modules
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const indexRouter = require("./routes/index-router.js");
const coursesRouter = require("./routes/courses-router.js");
const userRouter = require("./routes/user-router.js");
const studentRouter = require("./routes/student-router.js");
const educatorRouter = require("./routes/educator-router.js");

const port = 3000;
const app = express();

// Express to use EJS as templating engine
app.set("view engine", "ejs");

// Set location of static files (like CSS, JS, images), looks into "public" dir by default
app.use(express.static(__dirname + "/public"));

// Allow passing "request.body" form data
app.use(bodyParser.urlencoded({ extended: true }));

// Call session first, then routers
app.use(session({ secret: "secretKey", saveUninitialized: false, resave: false }));

// Set "local" variables, then call next() to proceed with rest of code file
// Thus, no need to pass the following variables to every route
app.use((request, response, next) => {
    // For EJS file's <title>
    response.locals.pageName = "You forgot to set 'pageName' in this page's EJS file!";
    response.locals.separator = " | ";
    response.locals.appName = "Bright Learning Academy";

    // For navbar.ejs
    response.locals.session = request.session;

    return next();
});

/**
 * Useful notes
 *
 * -----------------
 * Express functions
 * -----------------
 * app/router.get("/" + endpoint without prefixes)
 * response.render(HTML/EJS file) looks into "views" dir by default
 * response.redirect("/" + endpoint with prefixes included)
 *
 * db.get() returns {}    = query to get ONE row of results
 * db.all() returns [{},] = query to get MANY rows of results
 * db.run() returns NIL   = query to insert/update/delete only, nothing is returned
 *
 * --------------------------------------
 * HTML/EJS forms, accessibility, <a> tag
 * --------------------------------------
 * <* name="varName"> is used as variable name for routing in JS
 *
 * <form method="GET/POST" action="endpointHere"> must match JS' .post("endpointHere") function
 * <label for="matchingName"> selects <input id="matchingName">, this helps with accessibility
 *
 * <button name="whatIsYourName"> returns its <button value="thisIsMyName">
 *
 * <a href=""> only does GET requests
 * <a href="/" + endpoint with prefixes included>
 */

/**
 * Set endpoint's prefix from corresponding router.
 *
 * Within each router JS file, after creating necessary pages, handle invalid URLs via "/*".
 * Invalid URLs can occur due to user manipulating URL.
 */

app.use("/", indexRouter);
app.use("/courses", coursesRouter);
app.use("/user", userRouter);
app.use("/student", studentRouter);
app.use("/educator", educatorRouter);

// Handle invalid URLs via '/*' (likewise, uncomment this once everything above (the routers) is done)
app.get("/*", (request, response) => {
    return response.redirect("/");
});

// Start server
app.listen(port, () => {
    console.log(`App's server listening at http://localhost:${port}`);
});
