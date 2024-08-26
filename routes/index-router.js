// Import and setup modules
const express = require("express");
const { db } = require("../public/db.js");
const { errorPage, isLoggedIn, isNotLoggedIn } = require("../public/helper.js");
const fs = require("fs"); // For courses page to decide to use JPG or PNG image

// Initialise router
const router = express.Router();

// Home
router.get("/", (request, response) => {
    db.all("SELECT * FROM courses ORDER BY enrollCount DESC LIMIT 3", (err, topCourses) => {
        if (err) return errorPage(response, "Database error!");
        if (!topCourses) return errorPage(response, "No courses found!");
        let categories = [
            { iconscoutName: "uil uil-desktop", name: "Web Development", description: "Master the fundamentals of HTML, CSS, and JavaScript to build responsive and dynamic websites." },
            { iconscoutName: "uil uil-mobile-android", name: "Mobile App Development", description: "Learn to create powerful mobile applications for Android and iOS using frameworks like React Native and Flutter." },
            { iconscoutName: "uil uil-sitemap", name: "Data Structures and Algorithms", description: "Understand the core concepts of data structures and algorithms to solve complex problems efficiently." },
            { iconscoutName: "uil uil-robot", name: "Machine Learning", description: "Explore the world of AI by learning the principles of machine learning, including supervised and unsupervised learning." },
            { iconscoutName: "uil uil-lock-access", name: "Cybersecurity", description: "Gain insights into protecting systems and data from cyber threats through ethical hacking and security practices." },
            { iconscoutName: "uil uil-cloud-database-tree", name: "Cloud Computing", description: "Learn how to deploy and manage applications in the cloud with platforms like AWS, Azure, and Google Cloud." },
        ];
        let faqs = [
            { question: "How do I choose the right course for my needs?", answer: "We offer a variety of courses tailored to different skill levels and interests. To help you choose the right course, consider your current knowledge, goals, and the course syllabus. You can also reach out to our support team for personalized advice." },
            { question: "What is the course format?", answer: "Our courses are designed to be flexible and engaging, combining video lectures, quizzes, assignments, and hands-on projects. You can study at your own pace, with lifetime access to the course materials." },
            { question: "Will I receive a certificate upon completion?", answer: "Yes, upon successfully completing a course, you will receive a certificate of completion that you can share on your LinkedIn profile, resume, or with your employer." },
            { question: "Can I access the course content after completing it?", answer: "Absolutely! Once you enroll in a course, you have lifetime access to the content, including any updates or new materials added in the future." },
            { question: "Are there any prerequisites for enrolling in a course?", answer: "Some courses may require prior knowledge or skills. We recommend checking the course description and prerequisites before enrolling to ensure it aligns with your current level." },
            { question: "How do I interact with instructors and other students?", answer: "You can interact with instructors and fellow students through discussion forums, live Q&A sessions, and group projects. This collaborative environment enhances learning and provides valuable networking opportunities." },
            { question: "What if I have questions during the course?", answer: "If you have any questions or need clarification on the course material, you can post your questions in the course forum, where instructors and other students can assist you. We are here to support your learning journey." },
            { question: "What is your refund policy?", answer: "We offer a satisfaction guarantee. If you are not satisfied with a course, you can request a refund within 30 days of purchase. Please refer to our refund policy for more details." },
            { question: "How do I access the course materials?", answer: "Once you enroll in a course, you can access the materials through your account dashboard. All resources are available online and can be accessed from any device with an internet connection." },
            { question: "Do you offer group discounts or corporate training?", answer: "Yes, we offer discounts for group enrollments and customized corporate training solutions. Please contact our sales team for more information." },
        ];
        let testimonials = [
            {
                name: "Diana Ayi",
                role: "Student",
                quote: "Thanks to this platform, I was able to gain new skills in web development. The flexible learning pace helped me manage my time effectively while still working full-time.",
            },
            {
                name: "Edem Quist",
                role: "Student",
                quote: "The quality of instruction is unmatched. I loved the hands-on projects, which really helped me apply the theory I was learning.",
            },
            {
                name: "Hajia Bintu",
                role: "Student",
                quote: "I never thought I'd be able to code, but this platform made it possible. The beginner-friendly courses and great instructors boosted my confidence.",
            },
            {
                name: "Ernest Achiever",
                role: "Web Developer",
                quote: "The courses here are top-notch. I completed the Full-Stack Development program and received a certificate that helped me land a new role in just a few months!",
            },
            {
                name: "Sarah Mensah",
                role: "Data Analyst",
                quote: "The Data Science courses are fantastic! The knowledge I gained from this platform has been incredibly valuable in my current role as a Data Analyst.",
            },
            {
                name: "Kwame Ofori",
                role: "Marketing Manager",
                quote: "The digital marketing certification I earned here has greatly improved my career prospects. The course content was up-to-date and extremely relevant to today’s market.",
            },
            {
                name: "Joyce Adu",
                role: "Educator",
                quote: "As an instructor, I highly recommend this platform. It offers great tools for learners, and I was able to enrich my teaching materials by taking courses here myself.",
            },
        ];
        testimonials.forEach((testimonial) => {
            testimonial.picture = testimonial.name + ".jpg";
        });

        return response.render("index.ejs", {
            pageName: "Home",
            categories: categories,
            topCourses: topCourses,
            faqs: faqs,
            testimonials: testimonials,
        });
    });
});

// About
router.get("/about", (request, response) => {
    let teamMembers = [
        {
            name: "Alice White",
            role: "Software Developer",
            linkToInstagram: "https://instagram.com/alicewhite",
            linkToTwitter: "https://twitter.com/alicewhite",
            linkToLinkedin: "https://linkedin.com/in/alicewhite",
        },
        {
            name: "Sophie Johnson",
            role: "UI/UX Designer",
            linkToInstagram: "https://instagram.com/sophiejohnson",
            linkToTwitter: "https://twitter.com/sophiejohnson",
            linkToLinkedin: "https://linkedin.com/in/sophiejohnson",
        },
        {
            name: "Paulie Oliver",
            role: "Graphic Designer",
            linkToInstagram: "https://instagram.com/paulieoliver",
            linkToTwitter: "https://twitter.com/paulieoliver",
            linkToLinkedin: "https://linkedin.com/in/paulieoliver",
        },
        {
            name: "John Dumelo",
            role: "Project Manager",
            linkToInstagram: "https://instagram.com/johndumelo",
            linkToTwitter: "https://twitter.com/johndumelo",
            linkToLinkedin: "https://linkedin.com/in/johndumelo",
        },
        {
            name: "Emily Carter",
            role: "Business Analyst",
            linkToInstagram: "https://instagram.com/emilycarter",
            linkToTwitter: "https://twitter.com/emilycarter",
            linkToLinkedin: "https://linkedin.com/in/emilycarter",
        },
        {
            name: "Toni Cipriani",
            role: "Data Analyst",
            linkToInstagram: "https://instagram.com/tonicipriani",
            linkToTwitter: "https://twitter.com/tonicipriani",
            linkToLinkedin: "https://linkedin.com/in/tonicipriani",
        },
        {
            name: "Victor Vance",
            role: "HR Manager",
            linkToInstagram: "https://instagram.com/victorvance",
            linkToTwitter: "https://twitter.com/victorvance",
            linkToLinkedin: "https://linkedin.com/in/victorvance",
        },
        {
            name: "Ruth Shockings",
            role: "Marketing Specialist",
            linkToInstagram: "https://instagram.com/ruthshockings",
            linkToTwitter: "https://twitter.com/ruthshockings",
            linkToLinkedin: "https://linkedin.com/in/ruthshockings",
        },
    ];
    teamMembers.forEach((teamMember) => {
        teamMember.picture = teamMember.name + ".jpg";
    });
    teamMembers.sort((a, b) => a.name.localeCompare(b.name));

    return response.render("about.ejs", {
        pageName: "About",
        teamMembers: teamMembers,
    });
});

// Courses
router.get("/courses", (request, response) => {
    db.all("SELECT * FROM courses", (err, courses) => {
        if (err) return errorPage(response, "Database error!");
        if (!courses) return errorPage(response, "No courses found!");

        let sortOption = request.query.sort || "popular";
        if (sortOption === "popular") courses.sort((a, b) => b.enrollCount - a.enrollCount);
        else if (sortOption === "asc") courses.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortOption === "desc") courses.sort((a, b) => b.name.localeCompare(a.name));

        // Add "picture" property to each course, if JPG doesn't exist, then use PNG
        courses.forEach((course) => {
            let jpgPath = `./public/images/courses/${course.name}.jpg`;
            if (fs.existsSync(jpgPath)) course.picture = `${course.name}.jpg`;
            else course.picture = `${course.name}.png`;
        });

        return response.render("courses.ejs", {
            pageName: "Courses",
            courses: courses,
            sort: sortOption,
        });
    });
});

// Courses: Upon choosing a course
router.get("/courses/course/:courseId", (request, response) => {
    db.get("SELECT * FROM courses WHERE id = ?", [request.params.courseId], (err, course) => {
        if (err) return errorPage(response, "Database error!");
        if (!course) return errorPage(response, "No chosen course to view!");

        // Add "picture" property to course, if JPG doesn't exist, then use PNG
        let jpgPath = `./public/images/courses/${course.name}.jpg`;
        if (fs.existsSync(jpgPath)) course.picture = `${course.name}.jpg`;
        else course.picture = `${course.name}.png`;

        return response.render("course.ejs", {
            pageName: `Learn ${course.name}`,
            course: course,
        });
    });
});

// Courses: Upon choosing a course, then clicking "Add to Cart" (aka enroll)
router.post("/enroll", (request, response) => {
    let courseId = request.body.courseId;

    // If "session.cart" object does not exist, then create one (this also prevents object from refreshing upon every enroll)
    if (!request.session.cart) request.session.cart = [];

    // Check if course is already in cart
    let cart = request.session.cart;
    let courseExists = cart.find((item) => item.id == courseId);
    if (courseExists) return response.redirect("/cart?error=already_in_cart");

    // If course is not in cart, then "cart.push()" and redirect to cart page
    db.get("SELECT * FROM courses WHERE id = ?", [courseId], (err, course) => {
        if (err) return errorPage(response, "Database error!");
        if (!course) return errorPage(response, "No chosen course to add to cart!");

        cart.push(course);
        request.session.cart = cart; // Update "session.cart" object
        return response.redirect("/cart");
    });
});

// Cart
router.get("/cart", (request, response) => {
    const cartItems = request.session.cart || [];
    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

    response.render("cart.ejs", {
        pageName: "Cart",
        cartItems: cartItems,
        totalPrice: totalPrice,
    });
});

// Checkout Route - Redirect to login if not logged in
router.get("/checkout", (request, response) => {
    if (!request.session.user) return response.redirect("/user/login");

    const cartItems = request.session.cart || [];
    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

    response.render("checkout.ejs", {
        pageName: "Checkout",
        cartItems: cartItems,
        totalPrice: totalPrice,
        user: request.session.user, // Pass user details to the checkout page
    });
});

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

// Contact
router.get("/contact", (request, response) => {
    return response.render("contact.ejs", {
        pageName: "Contact",
    });
});

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
