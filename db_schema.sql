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

-- Game development
INSERT INTO courses (creator_id, category, name, description, price, enrollCount) VALUES (2, 'Game Development', 'C++', 'Enhance your programming skills with C++.', 80.50, 100000); 
INSERT INTO courses (creator_id, category, name, description, price) VALUES (3, 'Game Development', 'Unreal Engine', 'Kick off your game developer career with Unreal Engine', 80.50); 

-- Data Science
INSERT INTO courses (creator_id, category, name, description, price) VALUES (3, 'Data Science', 'Python', 'Explore Python for web development, data science, and more.', 90.50); 
INSERT INTO courses (creator_id, category, name, description, price) VALUES (3, 'Data Science', 'Data Science', 'Explore Python and data science.', 90.50);

-- Design
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

-- C++ course
INSERT INTO topics (course_id, name, description, video_url) VALUES (5, 'Introduction', 'Learn the basics of C++', 'https://www.youtube.com/watch?v=MNeX4EGtR5Y');
INSERT INTO topics (course_id, name, description, video_url) VALUES (5, 'Variables', 'Learn how to use variables in C++', 'https://www.youtube.com/watch?v=zB9RI8_wExo');
INSERT INTO topics (course_id, name, description, video_url) VALUES (5, 'Functions', 'Learn how to use functions in C++', 'https://www.youtube.com/watch?v=6SnxFx9aRps');

-- Adobe Illustrator course
INSERT INTO topics (course_id, name, description, video_url) VALUES (10, 'Introduction', 'Learn the basics of Adobe Illustrator', 'https://www.youtube.com/watch?v=QKWnkIPur2Q');
INSERT INTO topics (course_id, name, description, video_url) VALUES (10, 'Color Modes', 'Learn how to use color modes in Adobe Illustrator', 'https://www.youtube.com/watch?v=H0Bkk9UMkVc');

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
