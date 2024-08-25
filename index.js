// Import and setup modules
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");

const indexRouter = require("./routes/index-router.js");
const userRouter = require("./routes/user-router.js");

const port = 3000;
const app = express();

app.set("view engine", "ejs"); // Tell Express to use EJS as templating engine
app.use(express.static(__dirname + "/public")); // Set location of static files (eg. css, image, js)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secretKey", saveUninitialized: false, resave: false })); // Ensure session called first, and then routers

// Set default 'locals.variables', then call next() to proceed with rest of code file (mainly for .ejs file's <title>)
app.use((request, response, next) => {
    response.locals.pageName = "You forgot to set 'pageName' in this page's .ejs file!";
    response.locals.tabNameSeparator = " | ";
    response.locals.appName = "Bright Learning Academy";
    response.locals.session = request.session;
    next();
});

/**
 * Useful notes to reference throughout implementing routers!
 *
 * =========================
 * Express functions:
 * -------------------------
 * app.get()/router.get() = the endpoint with prefix, if any
 * response.render()      = looks into 'views' dir for a matching file name to load
 * response.redirect()    = the endpoint without prefix
 *
 * =========================
 * Forms and accessibility:
 * -------------------------
 * <* name="someName"> is used as variable name for routing in .js
 *
 * <form action="endpointHere"> must match with .js .post("endpointHere") function
 * <label for="matchingName"> selects <input id="matchingName">, this helps with accessibility
 *
 * <button name="whatIsYourName"> returns its <button value="theName">
 *
 * =========================
 * Linking URLs and source files:
 * -------------------------
 * <a href=""> = the endpoint with prefix, if any
 * <a href=""> only does GET requests
 *
 * Whenever a source file is referenced (eg. css' <link href=""> / url() / <img src=""> / <script src="">),
 * Express looks into 'public' dir for a matching file name to load
 *
 * This is set in index.js via "express.static()"
 *
 * =========================
 */

/**
 * Set URL's prefix with text from corresponding router.
 *
 * Within each router file, after every possible page, handle invalid URLs via '/*'.
 * Invalid URLs can occur due to user manipulating the URL.
 */

app.use("/", indexRouter);
app.use("/user", userRouter);

// Handle invalid URLs via '/*' (remove this and uncomment below at the end of everything!)
// app.get("/*", (request, response) => {
//     return response.redirect("/");
// });

// Start server
app.listen(port, () => {
    console.log(`App's server listening at http://localhost:${port}`);
});
