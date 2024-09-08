CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'educator')) NOT NULL
);

INSERT INTO users (email, username, password, role) VALUES ('student@email.com', 'student', 'student', 'student');
INSERT INTO users (email, username, password, role) VALUES ('educator@email.com', 'educator', 'educator', 'educator');
INSERT INTO users (email, username, password, role) VALUES ('educator2@email.com', 'educator2', 'educator2', 'educator');

CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    major TEXT,
    year INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE educators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    department TEXT,
    title TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO students (user_id, major, year) VALUES (1, 'Computer Science', 3);
INSERT INTO educators (user_id, department, title) VALUES (2, 'Computer Science', 'Professor');
INSERT INTO educators (user_id, department, title) VALUES (3, 'Business Marketing', 'Professor');

CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    displayName TEXT NOT NULL,
    bio TEXT ,
    introduction TEXT,
    profilePicture TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (1, 'Studious Sam', 'I am studying 24/7!', 'Not sure what''s the difference between intro and bio', 'cat.png');
INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (2, 'Compton Sierra', 'My initials also stands for "Computer Science"!', 'Ah whatever...', 'user.png');
INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (3, 'Bradley Matthew', 'My initials also stands for "Business Marketing"!', 'Ah whatever...', 'user.png');

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    enrollCount INTEGER DEFAULT 0, -- This increments upon students enrolling into it
    picture TEXT, -- This is set in JS routers
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Web developement
INSERT INTO courses (creator_id, category, name, description, price) VALUES (2, 'Web Development', 'HTML', 'Master the basics of web development with HTML.', 40.50);
INSERT INTO courses (creator_id, category, name, description, price) VALUES (2, 'Web Development', 'CSS', 'Style your websites with modern CSS techniques.', 50.50);

-- Programming
INSERT INTO courses (creator_id, category, name, description, price) VALUES (2, 'Programming', 'C Sharp', 'Build robust applications using C# and .NET framework.', 50.50); 
INSERT INTO courses (creator_id, category, name, description, price) VALUES (2, 'Programming', 'Java', 'Write cross-platform applications with Java.', 70.50); 

-- Game development (add "enrollCount" just as refernece)
INSERT INTO courses (creator_id, category, name, description, price, enrollCount) VALUES (2, 'Game Development', 'C++', 'Enhance your programming skills with C++.', 80.50, 100000); 
INSERT INTO courses (creator_id, category, name, description, price) VALUES (3, 'Game Development', 'Unreal Engine', 'Kick off your game developer career with Unreal Engine', 80.50); 

-- Data Science
INSERT INTO courses (creator_id, category, name, description, price) VALUES (3, 'Data Science', 'Python', 'Explore Python for web development, data science, and more.', 90.50); 
INSERT INTO courses (creator_id, category, name, description, price) VALUES (3, 'Data Science', 'Data Science', 'Explore Python and data science.', 90.50);

-- Design (add "enrollCount" just as refernece)
INSERT INTO courses (creator_id, category, name, description, price) VALUES (3, 'Design', 'UI-UX Design', 'The Complete guide for UI/UX design', 20.50);
INSERT INTO courses (creator_id, category, name, description, price, enrollCount) VALUES (3, 'Design', 'Adobe Illustrator', 'Essential course for graphic designers.', 30.50, 999);

CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    video_url TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- HTML course
INSERT INTO topics (course_id, name, description, video_url) VALUES (1, 'Introduction to HTML', 'Learn the basics of HTML', 'https://www.youtube.com/watch?v=dD2EISBDjWM');
INSERT INTO topics (course_id, name, description, video_url) VALUES (1, 'First Web Page', 'Let''s build our first web page', 'https://www.youtube.com/watch?v=-USAeFpVf_A');
INSERT INTO topics (course_id, name, description, video_url) VALUES (1, 'Useful HTML Tips', 'We''ll be learning about line breaks, spacing and so on', 'https://www.youtube.com/watch?v=i3GE-toQg-o');

-- CSS course
INSERT INTO topics (course_id, name, description, video_url) VALUES (2, 'Introduction to CSS', 'Learn the basics of CSS', 'https://www.youtube.com/watch?v=qKoajPPWpmo');
INSERT INTO topics (course_id, name, description, video_url) VALUES (2, 'Changing Basics', 'Learn how to change fonts and its properties', 'https://www.youtube.com/watch?v=UO0ZPL8yMpU');
INSERT INTO topics (course_id, name, description, video_url) VALUES (2, 'Selectors', 'All about CSS selectors', 'https://www.youtube.com/watch?v=JT0gyzbpD2U');
INSERT INTO topics (course_id, name, description, video_url) VALUES (2, 'Header and Borders', 'Useful tips and tricks for eyeballing it', 'https://www.youtube.com/watch?v=hCoMjvtsyPA');

-- C Sharp course
INSERT INTO topics (course_id, name, description, video_url) VALUES (3, 'Introduction to C#', '100 seconds of C#', 'https://www.youtube.com/watch?v=ravLFzIguCM');
INSERT INTO topics (course_id, name, description, video_url) VALUES (3, 'Getters and Setters', 'What do you get and what do you set', 'https://www.youtube.com/watch?v=8FmE_-QXg3Y');
INSERT INTO topics (course_id, name, description, video_url) VALUES (3, 'Polymorphism', 'No, this isn''t Yu-Gi-Oh polymerisation', 'https://www.youtube.com/watch?v=nYCMW3kfTvs');

-- Java course
INSERT INTO topics (course_id, name, description, video_url) VALUES (4, 'Introduction to Java', '100 seconds of Java', 'https://www.youtube.com/watch?v=l9AzO1FMgM8');
INSERT INTO topics (course_id, name, description, video_url) VALUES (4, 'Java Haters', 'All about Java but for the haters', 'https://www.youtube.com/watch?v=m4-HM_sCvtQ');

-- C++ course
INSERT INTO topics (course_id, name, description, video_url) VALUES (5, 'Introduction', '100 seconds of C++', 'https://www.youtube.com/watch?v=MNeX4EGtR5Y');
INSERT INTO topics (course_id, name, description, video_url) VALUES (5, 'Variables and Data Types', 'Learn the fundamentals of this language', 'https://www.youtube.com/watch?v=4psGUiKacPQ');
INSERT INTO topics (course_id, name, description, video_url) VALUES (5, 'What is ''const''', 'One of the more important data types', 'https://www.youtube.com/watch?v=MwQEaCsS6UM');
INSERT INTO topics (course_id, name, description, video_url) VALUES (5, 'Namespaces', 'Organising your code just got easier', 'https://www.youtube.com/watch?v=2lcIKzFHjSM');
INSERT INTO topics (course_id, name, description, video_url) VALUES (5, 'Typedef and Type Aliases', 'Sort of like nicknames but not for bullying', 'https://www.youtube.com/watch?v=7TJ7Z1-V_24');
INSERT INTO topics (course_id, name, description, video_url) VALUES (5, 'User Input', 'Make it interactable', 'https://www.youtube.com/watch?v=imiIhu9u670');

-- Unreal Engine course
INSERT INTO topics (course_id, name, description, video_url) VALUES (6, 'Welcome to Unreal', 'This is pretty unreal', 'https://www.youtube.com/watch?v=DXDe-2BC4cE');
INSERT INTO topics (course_id, name, description, video_url) VALUES (6, 'Installing and Setup', 'Let''s get on the same page before proceeding', 'https://www.youtube.com/watch?v=bDUFB1ng00Q');

-- Python course
INSERT INTO topics (course_id, name, description, video_url) VALUES (7, 'Data Structures', 'This is how everyone gets started in Python', 'https://www.youtube.com/watch?v=gOMW_n2-2Mw');
INSERT INTO topics (course_id, name, description, video_url) VALUES (7, 'Recursion', 'Like echos, but in Python', 'https://www.youtube.com/watch?v=ivl5-snqul8');
INSERT INTO topics (course_id, name, description, video_url) VALUES (7, 'Speed Comparison', 'Don''t listen to the Python haters', 'https://www.youtube.com/watch?v=VioxsWYzoJk');

-- UI-UX Design course
INSERT INTO topics (course_id, name, description, video_url) VALUES (9, 'World''s Shortest Design Course', 'Yep, what the title said', 'https://www.youtube.com/watch?v=wIuVvCuiJhU');
INSERT INTO topics (course_id, name, description, video_url) VALUES (9, 'Choosing Colours', 'Imagine not being able to read this', 'https://www.youtube.com/watch?v=HAlIWRcldoc');
INSERT INTO topics (course_id, name, description, video_url) VALUES (9, 'Dark Mode', 'My favourite setting', 'https://www.youtube.com/watch?v=6U9iC-c15AI');

-- Adobe Illustrator course
INSERT INTO topics (course_id, name, description, video_url) VALUES (10, 'Orange', 'Orange', 'https://www.youtube.com/watch?v=Gv9QH0Z-GMU');
INSERT INTO topics (course_id, name, description, video_url) VALUES (10, 'The Most Overpowered Tool', 'They say the pen is mightier than the sword', 'https://www.youtube.com/watch?v=Rk-JGsriJ4o');
INSERT INTO topics (course_id, name, description, video_url) VALUES (10, 'Colouring Tutorial', 'Yes, this is important', 'https://www.youtube.com/watch?v=eoeYMSdh0G8');
INSERT INTO topics (course_id, name, description, video_url) VALUES (10, 'Sketch to Vector', 'Turn your drawings immortal', 'https://www.youtube.com/watch?v=HeLb0dy81Lc');
INSERT INTO topics (course_id, name, description, video_url) VALUES (10, '2D to 3D', 'I wonder when 4D will come around', 'https://www.youtube.com/watch?v=-ZoDHEsd0Y4');

CREATE TABLE enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    course_id INTEGER,
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    course_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
