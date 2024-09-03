// Import and setup modules
const express = require("express");
const {
    // General helper functions
    return_twoDecimalPlaces,
    return_validPictureFilename,
    return_formattedNumber,
    // Database-related helper functions
    db_getCoursesLimited,
} = require("../public/helper.js");

// Initialise router
const router = express.Router();

// Note that all these URLs have no prefix!

// Home (Main)
router.get("/", db_getCoursesLimited(3), (request, response) => {
    let categories = [
        {
            iconscoutName: "uil uil-desktop",
            name: "Web Development",
            description: "Master the fundamentals of HTML, CSS, and JavaScript to build responsive and dynamic websites.",
        },
        {
            iconscoutName: "uil uil-mobile-android",
            name: "Mobile App Development",
            description: "Learn to create powerful mobile applications for Android and iOS using frameworks like React Native and Flutter.",
        },
        {
            iconscoutName: "uil uil-sitemap",
            name: "Data Structures and Algorithms",
            description: "Understand the core concepts of data structures and algorithms to solve complex problems efficiently.",
        },
        {
            iconscoutName: "uil uil-robot",
            name: "Machine Learning",
            description: "Explore the world of AI by learning the principles of machine learning, including supervised and unsupervised learning.",
        },
        {
            iconscoutName: "uil uil-lock-access",
            name: "Cybersecurity",
            description: "Gain insights into protecting systems and data from cyber threats through ethical hacking and security practices.",
        },
        {
            iconscoutName: "uil uil-cloud-database-tree",
            name: "Cloud Computing",
            description: "Learn how to deploy and manage applications in the cloud with platforms like AWS, Azure, and Google Cloud.",
        },
    ];

    request.topFewCourses.forEach((topCourse) => {
        topCourse.price = return_twoDecimalPlaces(topCourse.price);
        topCourse.picture = return_validPictureFilename("./public/images/courses/", topCourse.name);
        topCourse.enrollCount = return_formattedNumber(topCourse.enrollCount);
    });

    let faqs = [
        {
            question: "How do I choose the right course for my needs?",
            answer: "We offer a variety of courses tailored to different skill levels and interests. To help you choose the right course, consider your current knowledge, goals, and the course syllabus. You can also reach out to our support team for personalized advice.",
        },
        {
            question: "What is the course format?",
            answer: "Our courses are designed to be flexible and engaging, combining video lectures, quizzes, assignments, and hands-on projects. You can study at your own pace, with lifetime access to the course materials.",
        },
        {
            question: "Will I receive a certificate upon completion?",
            answer: "Yes, upon successfully completing a course, you will receive a certificate of completion that you can share on your LinkedIn profile, resume, or with your employer.",
        },
        {
            question: "Can I access the course content after completing it?",
            answer: "Absolutely! Once you enroll in a course, you have lifetime access to the content, including any updates or new materials added in the future.",
        },
        {
            question: "Are there any prerequisites for enrolling in a course?",
            answer: "Some courses may require prior knowledge or skills. We recommend checking the course description and prerequisites before enrolling to ensure it aligns with your current level.",
        },
        {
            question: "How do I interact with instructors and other students?",
            answer: "You can interact with instructors and fellow students through discussion forums, live Q&A sessions, and group projects. This collaborative environment enhances learning and provides valuable networking opportunities.",
        },
        {
            question: "What if I have questions during the course?",
            answer: "If you have any questions or need clarification on the course material, you can post your questions in the course forum, where instructors and other students can assist you. We are here to support your learning journey.",
        },
        {
            question: "What is your refund policy?",
            answer: "We offer a satisfaction guarantee. If you are not satisfied with a course, you can request a refund within 30 days of purchase. Please refer to our refund policy for more details.",
        },
        {
            question: "How do I access the course materials?",
            answer: "Once you enroll in a course, you can access the materials through your account dashboard. All resources are available online and can be accessed from any device with an internet connection.",
        },
        {
            question: "Do you offer group discounts or corporate training?",
            answer: "Yes, we offer discounts for group enrollments and customized corporate training solutions. Please contact our sales team for more information.",
        },
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
        testimonial.picture = return_validPictureFilename("./public/images/testimonials/", testimonial.name);
    });

    return response.render("index.ejs", {
        pageName: "Home",
        categories: categories,
        topFewCourses: request.topFewCourses,
        faqs: faqs,
        testimonials: testimonials,
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
        teamMember.picture = return_validPictureFilename("./public/images/team members/", teamMember.name);
    });
    teamMembers.sort((a, b) => a.name.localeCompare(b.name));

    return response.render("about.ejs", {
        pageName: "About",
        teamMembers: teamMembers,
    });
});

// Contact
router.get("/contact", (request, response) => {
    return response.render("contact.ejs", {
        pageName: "Contact",
    });
});

// Cart
router.get("/cart", (request, response) => {
    let totalPrice = 0;
    let cart = request.session.cart || [];
    cart.forEach((item) => {
        item.price = return_twoDecimalPlaces(item.price);
        item.picture = return_validPictureFilename("./public/images/courses/", item.name);
        totalPrice += parseFloat(item.price);
    });
    totalPrice = return_twoDecimalPlaces(totalPrice);

    return response.render("cart.ejs", {
        pageName: "Cart",
        cart: cart,
        totalPrice: totalPrice,
    });
});

router.post("/cart/remove", (request, response) => {
    let cart = request.session.cart || [];
    // Filter out matching "courseId" (from "<input name='courseId'>")
    cart = cart.filter((item) => item.id != parseInt(request.body.courseId, 10));
    request.session.cart = cart;
    return response.redirect("/cart");
});

module.exports = router;
