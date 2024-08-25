// Import and setup modules
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const indexRouter = require("./routes/index-router.js");
const userRouter = require("./routes/user-router.js");

const port = 3000;
const app = express();

app.set("view engine", "ejs"); // Express to use EJS as templating engine
app.use(express.static(__dirname + "/public")); // Set location of static files (like CSS, JS, images), looks into "public" dir by default
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secretKey", saveUninitialized: false, resave: false })); // Call session first, then routers
app.use((request, response, next) => {
    // Set default local variables, then call next() to proceed with rest of code file (this is mainly for .ejs file's <title>)
    response.locals.pageName = "You forgot to set 'pageName' in this page's .ejs file!";
    response.locals.separator = " | ";
    response.locals.appName = "Bright Learning Academy";
    response.locals.session = request.session;
    next();
});

/**
 * Useful notes
 *
 * -----------------
 * Express functions
 * -----------------
 * app/router.get("/" + endpoint without prefixes)
 * response.render(.ejs file) looks into "views" dir by default for a matching file
 * response.redirect("/" + endpoint with prefixes included)
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
app.use("/user", userRouter);

// Handle invalid URLs via '/*' (likewise, uncomment this once everything above (the routers) is done)
// app.get("/*", (request, response) => {
//     return response.redirect("/");
// });

// Start server
app.listen(port, () => {
    console.log(`App's server listening at http://localhost:${port}`);
});
