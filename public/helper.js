function errorPage(response, errorMessage) {
    response.render("standard/error.ejs", { errorMessage: errorMessage });
}

// Export module containing the following so external files can access it
module.exports = {
    errorPage,
};
