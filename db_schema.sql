CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('educator', 'student')) NOT NULL
);

CREATE TABLE educators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    department TEXT,
    title TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    major TEXT,
    year INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    displayName TEXT NOT NULL,
    bio TEXT ,
    introduction TEXT,
    profilePicture TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    enrollCount INTEGER NOT NULL
);

CREATE TABLE enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    course_id INTEGER,
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

INSERT INTO users (email, username, password, role) VALUES ('student@email.com', 'student', 'student', 'student');
INSERT INTO users (email, username, password, role) VALUES ('educator@email.com', 'educator', 'educator', 'educator');

INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (1, 'Studious Sam', 'I am studying 24/7!', 'Not sure what''s the difference between intro and bio', 'dog.png');
INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (2, 'Educational Eddie', 'Or should I put my educational instutution here?', 'Ah whatever...', 'dog.png');

INSERT INTO courses (name, description, price, enrollCount) VALUES ('HTML', 'Master the basics of web development with HTML.', 40.50, 3423);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('CSS', 'Style your websites with modern CSS techniques.', 50.50, 692);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('JavaScript', 'Get hands-on with JavaScript to build interactive web pages.', 70.50, 234);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('PHP', 'Develop server-side applications with PHP.', 60.50, 2314);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Python', 'Explore Python for web development, data science, and more.', 90.50, 753);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('C++', 'Enhance your programming skills with C++.', 80.50, 124);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('C Sharp', 'Build robust applications using C# and .NET framework.', 50.50, 69);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Java', 'Write cross-platform applications with Java.', 70.50, 6432);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Ruby', 'Create dynamic web applications with Ruby on Rails.', 60.50, 7573);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Go', 'Build efficient and scalable systems with Go.', 50.50, 3622);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Kotlin', 'Develop modern Android apps with Kotlin.', 80.50, 6244);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Swift', 'Create iOS apps using Swift.', 90.50, 734);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Rust', 'Build safe and fast systems with Rust.', 110.50, 11235);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Dart', 'Develop cross-platform mobile apps with Dart and Flutter.', 70.50, 2234);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('R', 'Perform statistical analysis and data visualization with R.', 60.50, 1543);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Lua', 'Integrate Lua scripting in your applications.', 80.50, 8342);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Haskell', 'Dive into functional programming with Haskell.', 70.50, 124);
INSERT INTO courses (name, description, price, enrollCount) VALUES ('Elixir', 'Build scalable and maintainable applications with Elixir.', 90.50, 1563);

