// Import and setup modules
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const indexRouter = require("./routes/index-router.js");
const port = 3000;
const app = express();

app.set("view engine", "ejs"); // Tell Express to use EJS as templating engine
app.use(express.static(__dirname + "/public")); // Set location of static files (eg. css, image, js)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secretKey", saveUninitialized: false, resave: false }));

// Set default 'locals.variables', then call next() to proceed with rest of code file (mainly for .ejs file's <title>)
app.use((request, response, next) => {
    response.locals.pageName = "You forgot to set 'pageName' in this page's .ejs file!";
    response.locals.tabNameSeparator = " | ";
    response.locals.appName = "Bright Learning Academy";
    response.locals.session = request.session;
    next();
});

/**
 * Set URL's prefix with text from corresponding router.
 *
 * Within each router file, after every possible page, handle invalid URLs via '/*'.
 * Invalid URLs can occur due to user manipulating the URL.
 */

app.use("/", indexRouter);

// Handle invalid URLs via '/*'
// app.get("/*", (request, response) => {
//     return response.redirect("/");
// });

// Start server
app.listen(port, () => {
    console.log(`App's server listening at http://localhost:${port}`);
});
