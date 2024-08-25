function errorPage(response, errorMessage) {
    response.render("standard/error.ejs", { errorMessage: errorMessage });
}

function isLoggedIn(request, response, next) {
    if (request.session.user) return response.redirect("/user/profile?error=already_logged_in");
    next();
}

function isNotLoggedIn(request, response, next) {
    if (!request.session.user) return response.redirect("/user/login?error=not_logged_in");
    next();
}

// Export module containing the following so external files can access it
module.exports = {
    errorPage,
    isLoggedIn,
    isNotLoggedIn,
};
