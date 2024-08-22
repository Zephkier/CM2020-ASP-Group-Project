// Import and setup modules
const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

const indexRouter = require("./routes/index-router.js");

const port = 3000;
const app = express();

app.set("view engine", "ejs"); // Tell Express to use EJS as templating engine
app.use(express.static(__dirname + "/public")); // Set location of static files (eg. css, image, js)
app.use(bodyParser.urlencoded({ extended: true }));

// Items in the global namespace are accessible throught out the node application
global.db = new sqlite3.Database("./database.db", function (err) {
    if (err) {
        console.error(err);
        process.exit(1); // Bail as cannot connect to database
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // Tell SQLite to pay attention to foreign key constraints
    }
});

// Set default 'locals.variables', then call next() to proceed with rest of code file (mainly for .ejs file's <title>)
app.use((request, response, next) => {
    response.locals.pageName = "You forgot to set 'pageName' in this page's .ejs file!";
    response.locals.tabNameSeparator = " | ";
    response.locals.appName = "Bright Learning Academy";
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
