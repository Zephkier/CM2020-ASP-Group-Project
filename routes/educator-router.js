// Import and setup modules
const express = require("express");

// Initialise router
const router = express.Router();

// Note that all these URLs has "/educator" prefix!

// Home (NIL)
router.get("/", (request, response) => {
    return response.send("Educator home");
});

// Handle invalid URLs (eg. "/user/*")
router.get("/*", (request, response) => {
    return response.redirect("/?error=invalid_url");
});

module.exports = router;
