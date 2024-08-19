// Import and setup modules
const express = require("express");
const router = express.Router();

/**
 * Useful notes to reference throughout implementation!
 *
 * =========================
 * Express functions:
 * -------------------------
 * app.get()/router.get() = the endpoint with prefix, if any
 * response.render()      = looks into 'views' dir for a matching file name to load
 * response.redirect()    = the endpoint without prefix
 *
 * =========================
 * Forms and accessibility:
 * -------------------------
 * <* name="someName"> is used as variable name for routing in .js
 *
 * <form action="endpointHere"> must match with .js .post("endpointHere") function
 * <label for="matchingName"> selects <input id="matchingName">, this helps with accessibility
 *
 * <button name="whatIsYourName"> returns its <button value="theName">
 *
 * =========================
 * Linking URLs and source files:
 * -------------------------
 * <a href=""> = the endpoint with prefix, if any
 * <a href=""> only does GET requests
 *
 * Whenever a source file is referenced (eg. css' <link href=""> / url() / <img src=""> / <script src="">),
 * Express looks into 'public' dir for a matching file name to load
 *
 * This is set in index.js via "express.static()"
 *
 * =========================
 */

// Home
router.get("/", (request, response) => {
    // Get top 3 courses with most enrollCount, this will be in backend anyway
    let courses = [
        { title: "Learn HTML", description: "Master the basics of web development with HTML.", enrollCount: 3423  },
        { title: "Learn CSS", description: "Style your websites with modern CSS techniques.", enrollCount: 692 },
        { title: "Learn JavaScript", description: "Get hands-on with JavaScript to build interactive web pages.", enrollCount: 234 },
    ];
    
    return response.render("index.ejs", {
        pageName: "Home",
        courses: courses,
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
    let courses = [
        { title: "Learn HTML", description: "Master the basics of web development with HTML.", enrollCount: 3423  },
        { title: "Learn CSS", description: "Style your websites with modern CSS techniques.", enrollCount: 692 },
        { title: "Learn JavaScript", description: "Get hands-on with JavaScript to build interactive web pages.", enrollCount: 234 },
        { title: "Learn PHP", description: "Develop server-side applications with PHP.", enrollCount: 2314 },
        { title: "Learn Python", description: "Explore Python for web development, data science, and more.", enrollCount: 753 },
        { title: "Learn C++", description: "Enhance your programming skills with C++.", enrollCount: 124 },
        { title: "Learn C#", description: "Build robust applications using C# and .NET framework.", enrollCount: 69 },
        { title: "Learn Java", description: "Write cross-platform applications with Java.", enrollCount: 6432 },
        { title: "Learn Ruby", description: "Create dynamic web applications with Ruby on Rails.", enrollCount: 7573 },
        { title: "Learn Go", description: "Build efficient and scalable systems with Go.", enrollCount: 3622 },
        { title: "Learn Kotlin", description: "Develop modern Android apps with Kotlin.", enrollCount: 6244 },
        { title: "Learn Swift", description: "Create iOS apps using Swift.", enrollCount: 734 },
        { title: "Learn Rust", description: "Build safe and fast systems with Rust.", enrollCount: 11235 },
        { title: "Learn Dart", description: "Develop cross-platform mobile apps with Dart and Flutter.", enrollCount: 2234 },
        { title: "Learn R", description: "Perform statistical analysis and data visualization with R.", enrollCount: 1543 },
        { title: "Learn Lua", description: "Integrate Lua scripting in your applications.", enrollCount: 8342 },
        { title: "Learn Haskell", description: "Dive into functional programming with Haskell.", enrollCount: 124 },
        { title: "Learn Elixir", description: "Build scalable and maintainable applications with Elixir.", enrollCount: 1563 },
    ];

    // Get the sorting option from query parameters
    const sortOption = request.query.sort || 'popular';

    // Sort the courses based on the selected option
    if (sortOption === 'popular') {
        courses.sort((a, b) => b.enrollCount - a.enrollCount); // Most popular first
    } else if (sortOption === 'asc') {
        courses.sort((a, b) => a.title.localeCompare(b.title)); // Alphabetical A-Z
    } else if (sortOption === 'desc') {
        courses.sort((a, b) => b.title.localeCompare(a.title)); // Alphabetical Z-A
    }

    // Render the courses page with sorted courses
    return response.render("courses.ejs", {
        pageName: "Courses",
        courses: courses,
        sort: sortOption // Pass the selected sort option to the template
    });
});

// Contact
router.get("/contact", (request, response) => {
    return response.render("contact.ejs", {
        pageName: "Contact",
    });
});

// Profile
// If user is not logged in, then redirect to login page
// If user is logged in, then proceed to profile page as per normal
router.get("/profile", (request, response) => {
    return response.render("profile.ejs", {
        pageName: "My Profile",
    });
});


//log in
router.get("/login", (request, response) => {
    return response.render("login.ejs", {
        pageName: "Login", errorMessage: null
    });
});


// Route - handle user login
router.post('/login', (request, response) => {
    const { usernameOrEmail, password } = req.body;

    // // Verify the user's credentials
    // db.get('SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?', [usernameOrEmail, usernameOrEmail, password], (err, row) => {
    //     if (err) {
    //         console.error('Database error:', err.message);
    //         res.render('login', { title: 'Login', errorMessage: 'Database error' });
    //     } else if (row) {
    //         // Fetch user profile information
    //         db.get('SELECT bio, introduction, displayName FROM user_profiles WHERE user_id = ?', [row.user_id], (err, profile) => {
    //             if (err) {
    //                 console.error('Database error:', err.message);
    //                 res.render('login', { title: 'Login', errorMessage: 'Database error' });
    //             } else {
    //                 // Set session variables for the authenticated user
    //                 req.session.authenticated = true;
    //                 req.session.username = row.username;
    //                 req.session.userId = row.user_id;
    //                 req.session.bio = profile ? profile.bio : 'No bio available.';
    //                 req.session.introduction = profile ? profile.introduction : 'No introduction available.';
    //                 req.session.displayName = profile ? profile.displayName : row.username;
    //                 req.session.blogTitle = profile ? profile.blogTitle : `${row.username}'s Blog`;

    //                 res.redirect('/profile');
    //             }
    //         });
    //     } else {
    //         res.render('login', { title: 'Login', errorMessage: 'Invalid username/email or password' });
    //     }
    // });
});


// Route - render the add-user form
router.get('/add_user', (request, response) => {
    return response.render('add_user.ejs', {
        pageName : 'Add User'
    });
});



// Route - handle user registration form submission
router.post('/add_user', (request, response) => {
    const { username, email, password } = req.body;

    // Check if the username or email already exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).send('Database error');
        } else if (row) {
            // Respond with an error if the username or email is taken
            if (row.username === username) {
                res.status(400).send('Username already exists');
            } else {
                res.status(400).send('Email already exists');
            }
        } else {
            // Insert the new user into the database
            db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, password], function (err) {
                if (err) {
                    console.error('Error inserting user:', err.message);
                    res.status(500).send('Error inserting user');
                } else {
                    const userId = this.lastID;
                    // Insert default profile info for the new user
                    db.run('INSERT INTO user_profiles (user_id, bio, introduction, displayName, blogTitle, icon) VALUES (?, ?, ?, ?, ?, ?)',
                        [userId, 'No bio available.', 'No introduction available.', username, `${username}'s Blog`, 'user.png'], (err) => {
                            if (err) {
                                console.error('Error inserting user profile:', err.message);
                                res.status(500).send('Error inserting user profile');
                            } else {
                                console.log('New user and profile inserted:', username);
                                res.redirect('/login');
                            }
                        });
                }
            });
        }
    });
});

// Cart
router.get("/cart", (request, response) => {
    return response.render("cart.ejs", {
        pageName: "Cart",
    });
});

// Search
router.get("/search", (request, response) => {
    const query = request.query.q;
    if (!query) return response.redirect("/");

    return response.render("search.ejs", {
        pageName: "Search",
        query: query
    });
});

// Handle invalid URLs via '/*'
router.get("/*", (request, response) => {
    return response.redirect("/");
});

// Export module containing the following so external files can access it
module.exports = router;
