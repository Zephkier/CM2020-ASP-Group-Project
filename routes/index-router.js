// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const { errorPage, isLoggedIn, isNotLoggedIn } = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Home
router.get("/", (request, response) => {
    db.all("SELECT * FROM courses ORDER BY enrollCount DESC LIMIT 3", (err, topCourses) => {
        if (err) return errorPage(response, "Database error!");
        if (!topCourses) return errorPage(response, "No courses found!");

        return response.render("index.ejs", {
            pageName: "Home",
            topCourses: topCourses,
        });
    });
});

// About
router.get("/about", (request, response) => {
    return response.render("about.ejs", {
        pageName: "About",
    });
});

// Courses
router.get("/courses", (request, response) => {
    db.all("SELECT * FROM courses", (err, allCourses) => {
        if (err) return errorPage(response, "Database error!");
        if (!allCourses) return errorPage(response, "No courses found!");

        let sortOption = request.query.sort || "popular";
        if (sortOption === "popular") allCourses.sort((a, b) => b.enrollCount - a.enrollCount);
        else if (sortOption === "asc") allCourses.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortOption === "desc") allCourses.sort((a, b) => b.name.localeCompare(a.name));

        return response.render("courses.ejs", {
            pageName: "Courses",
            allCourses: allCourses,
            sort: sortOption,
        });
    });
});

// Individual Course
router.get("/courses/course/:courseId", (request, response) => {
    db.get("SELECT * FROM courses WHERE id = ?", [request.params.courseId], (err, chosenCourse) => {
        if (err) return errorPage(response, "Database error!");
        if (!chosenCourse) return errorPage(response, "No chosen course!");

        return response.render("course.ejs", {
            pageName: "Course",
            chosenCourse: chosenCourse,
        });
    });
});

// Contact
router.get("/contact", (request, response) => {
    return response.render("contact.ejs", {
        pageName: "Contact",
    });
});

//-----------------------------------------CART PAGE--------------------------------------------------------------
// In course page, click "Add to Cart"
router.post("/enroll", (req, res) => {
    const courseId = req.body.courseId;

    // Add cart object to session object
    req.session.cart = [];
    const cart = req.session.cart;
    const existingItem = cart.find((item) => item.id === courseId);

    if (!existingItem) {
        // Retrieve course details from the database
        db.get("SELECT * FROM courses WHERE id = ?", [courseId], (err, course) => {
            if (err) {
                console.error("Database error:", err.message);
                return res.status(500).send("Database error");
            }

            if (course) {
                cart.push({
                    id: course.id,
                    name: course.name,
                    description: course.description,
                    price: course.price,
                });

                req.session.cart = cart; // Update the session cart
                return res.redirect("/cart"); // Redirect to the cart page
            } else {
                return res.status(404).send("Course not found");
            }
        });
    } else {
        return res.redirect("/cart"); // If the course is already in the cart, just redirect to the cart
    }
});

// Route to display the cart page
router.get("/cart", (req, res) => {
    console.log(req.session); // TEST
    const cartItems = req.session.cart || [];
    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

    res.render("cart.ejs", {
        pageName: "Cart",
        cartItems: cartItems,
        totalPrice: totalPrice,
    });
});

//-----------------------------------------CHECKOUT--------------------------------------------------------------

// Checkout Route - Redirect to login if not logged in
router.get("/checkout", (req, res) => {
    if (!req.session.user) return res.redirect("/user/login");

    const cartItems = req.session.cart || [];
    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

    res.render("checkout.ejs", {
        pageName: "Checkout",
        cartItems: cartItems,
        totalPrice: totalPrice,
        user: req.session.user, // Pass user details to the checkout page
    });
});

// // Payment Processing Route FIXME are we still using this?
// router.post("/process-payment", (req, res) => {
//     const paymentMethod = req.body.paymentMethod;
//     const userId = req.session.user.userId;
//     const cartItems = req.session.cart || [];

//     // Simulate payment processing (replace with real payment gateway integration) // TEST
//     console.log(`Processing payment with ${paymentMethod}...`);

//     // Add courses to the user's profile after successful payment
//     cartItems.forEach((item) => {
//         db.run("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", [userId, item.id], (err) => {
//             if (err) {
//                 console.error("Database error adding course to profile:", err.message);
//                 return res.status(500).send("Database error");
//             }
//         });
//     });

//     // Clear the cart after purchase
//     req.session.cart = [];

//     // Redirect to profile page after successful purchase
//     res.redirect("/user/profile");
// });

// Function to handle enrollment processing
function processEnrollment(userId, cartItems) {
    const promises = cartItems.map((item) => {
        return new Promise((resolve, reject) => {
            // Check if the course is already enrolled
            db.get("SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, item.id], (err, existingEnrollment) => {
                if (err) {
                    console.error("Database error checking enrollment:", err.message);
                    return reject(err);
                }

                if (!existingEnrollment) {
                    // Insert the course into the enrollments table if it's not already enrolled
                    db.run("INSERT INTO enrollments (user_id, course_id, enrollment_date) VALUES (?, ?, CURRENT_TIMESTAMP)", [userId, item.id], (err) => {
                        if (err) {
                            console.error("Database error:", err.message);
                            return reject(err);
                        }
                        resolve();
                    });
                } else {
                    resolve(); // Already enrolled, resolve without inserting
                }
            });
        });
    });

    // Return a promise that resolves when all items are processed
    return Promise.all(promises);
}

// Route to handle Apple Pay payment
router.post("/checkout/applepay", (req, res) => {
    const userId = req.session.user.id;
    const cartItems = req.session.cart;

    // Process the enrollments
    processEnrollment(userId, cartItems)
        .then(() => {
            // Clear the cart after successful payment
            req.session.cart = [];

            // Fetch the updated enrolled courses to update the session
            db.all("SELECT courses.name, courses.description FROM enrollments JOIN courses ON enrollments.course_id = courses.id WHERE enrollments.user_id = ?", [userId], (err, enrolledCourses) => {
                if (err) {
                    console.error("Database error:", err.message);
                    return res.status(500).send("Database error");
                }

                // Update the session with the new enrolled courses
                req.session.user.enrolledCourses = enrolledCourses || [];

                // Redirect to the user's profile
                res.redirect("/user/profile");
            });
        })
        .catch((err) => {
            res.status(500).send("Failed to process the payment.");
        });
});

// Route to handle Credit Card payment
router.post("/checkout/creditcard", (req, res) => {
    const userId = req.session.user.id;
    const { cardNumber, cardExpiry, cardCVC } = req.body;
    const cartItems = req.session.cart;

    // Process the enrollments
    processEnrollment(userId, cartItems)
        .then(() => {
            // Clear the cart after successful payment
            req.session.cart = [];

            // Fetch the updated enrolled courses to update the session
            db.all("SELECT courses.name, courses.description FROM enrollments JOIN courses ON enrollments.course_id = courses.id WHERE enrollments.user_id = ?", [userId], (err, enrolledCourses) => {
                if (err) {
                    console.error("Database error:", err.message);
                    return res.status(500).send("Database error");
                }

                // Update the session with the new enrolled courses
                req.session.user.enrolledCourses = enrolledCourses || [];

                // Redirect to the user's profile
                res.redirect("/user/profile");
            });
        })
        .catch((err) => {
            res.status(500).send("Failed to process the payment.");
        });
});

//-----------------------------------------SEARCH--------------------------------------------------------------
// Search
router.get("/search", (request, response) => {
    const query = request.query.q;
    if (!query) return response.redirect("/");

    return response.render("search.ejs", {
        pageName: "Search",
        query: query,
    });
});

module.exports = router;
