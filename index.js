// Import and setup modules
const express = require("express");
const indexRouter = require("./routes/index-router.js");
const app = express();
const port = 3000;

// Tell Express to use EJS as templating engine
app.set("view engine", "ejs");

// Set location of static files
app.use(express.static(__dirname + "/public"));

// Set default 'locals.variables', then call next() to proceed with rest of code file
// This is for .ejs file's <title>
app.use((request, response, next) => {
    response.locals.pageName = "You forgot to set 'pageName' in this page's .ejs file!";
    response.locals.tabNameSeparator = " | ";
    response.locals.appName = "BLA";
    next();
});

/**
 * Set URL's prefix with text from corresponding router.
 *
 * Within each router file, after every possible page, handle invalid URLs via '/*'.
 * Invalid URLs can occur due to user manipulating the URL.
 */

app.use("/", indexRouter);

app.get("/*", (request, response) => {
    return response.redirect("/");
});

// Start server
app.listen(port, () => {
    console.log(`App's server listening at http://localhost:${port}`);
});
