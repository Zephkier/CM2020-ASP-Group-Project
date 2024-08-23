CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'educator')) NOT NULL
);

CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    major TEXT DEFAULT 'Not Enrolled',
    year INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE educators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    department TEXT DEFAULT 'No Department',
    title TEXT  DEFAULT 'No Title',
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    displayName TEXT NOT NULL,
    bio TEXT,
    introduction TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    enrollCount INTEGER NOT NULL
);

INSERT INTO users (email, username, password, role) VALUES ('student@email.com', 'student', 'student', 'student');
INSERT INTO users (email, username, password, role) VALUES ('educator@email.com', 'educator', 'educator', 'educator');

INSERT INTO profiles (user_id, displayName, bio, introduction) VALUES (1, 'Studious Sam', 'I am studying 24/7!', 'Not sure what''s the difference between intro and bio');
INSERT INTO profiles (user_id, displayName, bio, introduction) VALUES (2, 'Educational Eddie', 'Or should I put my educational instutution here?', 'Ah whatever...');

INSERT INTO courses (name, description, enrollCount) VALUES ('HTML', 'Master the basics of web development with HTML.', 3423);
INSERT INTO courses (name, description, enrollCount) VALUES ('CSS', 'Style your websites with modern CSS techniques.', 692);
INSERT INTO courses (name, description, enrollCount) VALUES ('JavaScript', 'Get hands-on with JavaScript to build interactive web pages.', 234);
INSERT INTO courses (name, description, enrollCount) VALUES ('PHP', 'Develop server-side applications with PHP.', 2314);
INSERT INTO courses (name, description, enrollCount) VALUES ('Python', 'Explore Python for web development, data science, and more.', 753);
INSERT INTO courses (name, description, enrollCount) VALUES ('C++', 'Enhance your programming skills with C++.', 124);
INSERT INTO courses (name, description, enrollCount) VALUES ('C#', 'Build robust applications using C# and .NET framework.', 69);
INSERT INTO courses (name, description, enrollCount) VALUES ('Java', 'Write cross-platform applications with Java.', 6432);
INSERT INTO courses (name, description, enrollCount) VALUES ('Ruby', 'Create dynamic web applications with Ruby on Rails.', 7573);
INSERT INTO courses (name, description, enrollCount) VALUES ('Go', 'Build efficient and scalable systems with Go.', 3622);
INSERT INTO courses (name, description, enrollCount) VALUES ('Kotlin', 'Develop modern Android apps with Kotlin.', 6244);
INSERT INTO courses (name, description, enrollCount) VALUES ('Swift', 'Create iOS apps using Swift.', 734);
INSERT INTO courses (name, description, enrollCount) VALUES ('Rust', 'Build safe and fast systems with Rust.', 11235);
INSERT INTO courses (name, description, enrollCount) VALUES ('Dart', 'Develop cross-platform mobile apps with Dart and Flutter.', 2234);
INSERT INTO courses (name, description, enrollCount) VALUES ('R', 'Perform statistical analysis and data visualization with R.', 1543);
INSERT INTO courses (name, description, enrollCount) VALUES ('Lua', 'Integrate Lua scripting in your applications.', 8342);
INSERT INTO courses (name, description, enrollCount) VALUES ('Haskell', 'Dive into functional programming with Haskell.', 124);
INSERT INTO courses (name, description, enrollCount) VALUES ('Elixir', 'Build scalable and maintainable applications with Elixir.', 1563);

CREATE TABLE enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    course_id INTEGER,
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

ALTER TABLE profiles ADD COLUMN profilePicture TEXT;
