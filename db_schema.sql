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
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    enrollCount INTEGER NOT NULL,
    video_url TEXT NOT NULL,
    picture TEXT NOT NULL,
    category TEXT NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Web developement
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'HTML', 'Master the basics of web development with HTML.', 40.50, 10, 'https://www.youtube.com/watch?v=qz0aGYrrlhU', 'HTML.png', 'Web Development');
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'CSS', 'Style your websites with modern CSS techniques.', 50.50, 10, 'https://www.youtube.com/watch?v=wRNinF7YQqQ', 'CSS.jpg' , 'Web Development');
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'JavaScript', 'Get hands-on with JavaScript to build interactive web pages.', 70.50, 10, 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 'JavaScript.jpg', 'Web Development');
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'PHP', 'Develop server-side applications with PHP.', 60.50, 10, 'https://www.youtube.com/watch?v=KBT2gmAfav4', 'PHP.jpg', 'Web Development'); 

-- Computer programming
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Swift', 'Create iOS apps using Swift.', 90.50, 730, 'https://www.youtube.com/watch?v=comQ1-x2a1Q', 'Swift.jpg', 'Computer Programming'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Ruby', 'Create dynamic web applications with Ruby on Rails.', 60.50, 7570, 'https://www.youtube.com/watch?v=t_ispmWmdjY', 'Ruby.png', 'Computer Programming'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'C Sharp', 'Build robust applications using C# and .NET framework.', 50.50, 70, 'https://www.youtube.com/watch?v=gfkTfcpWqAY', 'C Sharp.png', 'Computer Programming'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Java', 'Write cross-platform applications with Java.', 70.50, 6430, 'https://www.youtube.com/watch?v=eIrMbAQSU34', 'Java.png', 'Computer Programming'); 


-- Game development
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'C++', 'Enhance your programming skills with C++.', 80.50, 120, 'https://www.youtube.com/watch?v=ZzaPdXTrSb8', 'C++.jpg', 'Game Development'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Lua', 'Integrate Lua scripting in your applications.', 80.50, 8340, 'https://www.youtube.com/watch?v=iMacxZQMPXs', 'Lua.png', 'Game Development'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Unity Game developer', 'Design and develop your own video games with Unity ', 80.50, 140, 'https://www.youtube.com/watch?v=XtQMytORBmM', 'Unity.jpg', 'Game Development'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Unreal Engine Full Course', 'Kick off your game developer career with Unreal Engine', 80.50, 90, 'https://www.youtube.com/watch?v=6UlU_FsicK8', 'Unreal.jpg', 'Game Development'); 

-- Data Science
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'R', 'Perform statistical analysis and data visualization with R.', 60.50, 1540, 'https://www.youtube.com/watch?v=_V8eKsto3Ug', 'R.jpg', 'Data Science'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Python', 'Explore Python for web development, data science, and more.', 90.50, 750, 'https://www.youtube.com/watch?v=kqtD5dpn9C8', 'Python.png', 'Data Science'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'The DataScience Course', 'Explore Python and data science.', 90.50, 2750, 'https://www.youtube.com/watch?v=RBSUwFGa6Fk', 'Data Science.jpg', 'Data Science');
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Essential Math for DataScience', 'Explore Python and data science.', 90.50, 2750, 'https://www.youtube.com/watch?v=JprOckkzCok', 'Math Ds.jpg', 'Data Science');

-- Design
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Graphic Design', 'The Ultimate Graphic Design Course', 90.50, 275, 'https://www.youtube.com/watch?v=GQS7wPujL2k', 'Graphics.jpg', 'Design');
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'UI/UX Design', 'The Complete guide for UI/UX design', 20.50, 2172, 'https://www.youtube.com/watch?v=YqkyasAg00I', 'Uiux.jpg', 'Design');
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Design Principles', 'Learn to design powerful user interface.', 30.50, 12, 'https://www.youtube.com/watch?v=uwNClNmekGU', 'Principles.jpg', 'Design');
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Adobe Illustrator', 'Essential course for graphic designers.', 30.50, 12, 'https://www.youtube.com/watch?v=3NBKRywEbNs', 'Adobe Illustrator.jpg', 'Design');


-- Others 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Go', 'Build efficient and scalable systems with Go.', 50.50, 3620, 'https://www.youtube.com/watch?v=446E-r0rXHI', 'Go.jpg', 'Others'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Kotlin', 'Develop modern Android apps with Kotlin.', 80.50, 6240, 'https://www.youtube.com/watch?v=F9UC9DY-vIU', 'Kotlin.jpg', 'Others'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Rust', 'Build safe and fast systems with Rust.', 110.50, 11230, 'https://www.youtube.com/watch?v=MsocPEZBd-M', 'Rust.png', 'Others'); 
INSERT INTO courses (creator_id, name, description, price, enrollCount, video_url, picture, category) VALUES (2, 'Dart', 'Develop cross-platform mobile apps with Dart and Flutter.', 70.50, 2230, 'https://www.youtube.com/watch?v=Ej_Pcr4uC2Q', 'Dart.jpg', 'Others'); 

-- TODO Thinking of adding this, need to first setup some courses
CREATE TABLE topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

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
