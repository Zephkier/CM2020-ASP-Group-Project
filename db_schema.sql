CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'educator')) NOT NULL
);

INSERT INTO users (email, username, password, role) VALUES ('student@email.com', 'student', 'student', 'student');
INSERT INTO users (email, username, password, role) VALUES ('educator@email.com', 'educator', 'educator', 'educator');

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
INSERT INTO educators (user_id, department, title) VALUES (2, 'Computer Science', 'Instructor');

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
INSERT INTO profiles (user_id, displayName, bio, introduction, profilePicture) VALUES (2, 'Educational Eddie', 'Or should I put my educational instutution here...?', 'Ah whatever...', 'user.png');

CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    enrollCount INTEGER NOT NULL,
    video_url TEXT NOT NULL,
    creator TEXT NOT NULL,
    picture TEXT NOT NULL
);

INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('HTML', 'Master the basics of web development with HTML.', 40.50, 10, 'https://www.youtube.com/watch?v=qz0aGYrrlhU', 'Alex Johnson','HTML.jpg');
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('CSS', 'Style your websites with modern CSS techniques.', 50.50, 10, 'https://www.youtube.com/watch?v=wRNinF7YQqQ', 'Morgan Taylor','CSS.jpg');
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('JavaScript', 'Get hands-on with JavaScript to build interactive web pages.', 70.50, 10, 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 'Riley Brown','JavaScript.jpg');
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('PHP', 'Develop server-side applications with PHP.', 60.50, 10, 'https://www.youtube.com/watch?v=KBT2gmAfav4', 'Jordan White', 'PHP.png'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Python', 'Explore Python for web development, data science, and more.', 90.50, 750, 'https://www.youtube.com/watch?v=kqtD5dpn9C8', 'Skyler Harris','Python.jpg'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('C++', 'Enhance your programming skills with C++.', 80.50, 120, 'https://www.youtube.com/watch?v=ZzaPdXTrSb8', 'Jamie Smith','C++.png'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('C Sharp', 'Build robust applications using C# and .NET framework.', 50.50, 70, 'https://www.youtube.com/watch?v=gfkTfcpWqAY', 'Quinn Anderson','C Sharp.jpg'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Java', 'Write cross-platform applications with Java.', 70.50, 6430, 'https://www.youtube.com/watch?v=eIrMbAQSU34', 'Taylor Jackson','Java.png'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Ruby', 'Create dynamic web applications with Ruby on Rails.', 60.50, 7570, 'https://www.youtube.com/watch?v=t_ispmWmdjY', 'Avery Thomas','Ruby.png'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Go', 'Build efficient and scalable systems with Go.', 50.50, 3620, 'https://www.youtube.com/watch?v=446E-r0rXHI', 'Casey Martin','Go.jpg'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Kotlin', 'Develop modern Android apps with Kotlin.', 80.50, 6240, 'https://www.youtube.com/watch?v=F9UC9DY-vIU', 'Riley Brown','Kotlin.jpg'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Swift', 'Create iOS apps using Swift.', 90.50, 730, 'https://www.youtube.com/watch?v=comQ1-x2a1Q', 'Alex Johnson','Swift.png'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Rust', 'Build safe and fast systems with Rust.', 110.50, 11230, 'https://www.youtube.com/watch?v=MsocPEZBd-M', 'Morgan Taylor','Rust.png'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Dart', 'Develop cross-platform mobile apps with Dart and Flutter.', 70.50, 2230, 'https://www.youtube.com/watch?v=Ej_Pcr4uC2Q', 'Jamie Smith','Dart.jpg'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('R', 'Perform statistical analysis and data visualization with R.', 60.50, 1540, 'https://www.youtube.com/watch?v=_V8eKsto3Ug', 'Skyler Harris','R.jpg'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Lua', 'Integrate Lua scripting in your applications.', 80.50, 8340, 'https://www.youtube.com/watch?v=iMacxZQMPXs', 'Quinn Anderson','Lua.png'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Haskell', 'Dive into functional programming with Haskell.', 70.50, 120, 'https://www.youtube.com/watch?v=02_H3LjqMr8', 'Taylor Jackson','Haskell.png'); 
INSERT INTO courses (name, description, price, enrollCount, video_url, creator, picture) VALUES ('Elixir', 'Build scalable and maintainable applications with Elixir.', 90.50, 1560, 'https://www.youtube.com/watch?v=-lgtb-YSUWE', 'Avery Thomas','Elixir.jpg');

CREATE TABLE enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    course_id INTEGER,
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
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
