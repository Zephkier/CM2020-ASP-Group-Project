// Import and setup modules
const express = require("express");
const router = express.Router();

/**
 * Useful notes for reference throughout implementation:
 *
 * app.get()/router.get() = the endpoint with prefix, if any
 * response.render()      = looks into 'views' dir for a matching file name to load
 * response.redirect()    = the endpoint without prefix
 *
 * <* name="someName"> is used as variable name for routing in .js
 *
 * <form action="endpointHere"> must match with .js .post("endpointHere") function
 * <label for="matchingName"> selects <input id="matchingName">, this helps with accessibility
 *
 * <button name="whatIsYourName"> returns its <button value="theName">
 *
 * <a href=""> = the endpoint with prefix, if any
 * <a href=""> only does GET requests
 *
 * <* href=""> looks into 'public' dir for a matching file name to load
 */

// Home
router.get("/", (request, response) => {
    return response.render("index.ejs", {
        pageName: "Home",
    });
});

// About
router.get("/about", (request, response) => {
    return response.send("About");
});

// Courses
router.get("/courses", (request, response) => {
    return response.send("Courses");
});

// Contact
router.get("/contact", (request, response) => {
    return response.send("Contact");
});

// Handle invalid URLs via '/*'
router.get("/*", (request, response) => {
    return response.redirect("/");
});

// Export module containing the following so external files can access it
module.exports = router;
