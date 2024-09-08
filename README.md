# 🌟 Agile Software Project (ASP) - Bright Learning Academy

Welcome to the Agile Software Project (ASP) for **Bright Learning Academy**! This guide will help you set up and run the project on your local machine in just a few simple steps.

## 🚀 Quick Start Guide

### Within the terminal...

1.  **Install dependencies used in project**

    Run: `npm install`

2.  **Build backend database**

    If you're on Mac, Linux or Unix-based system, then run: `npm run build-db`

    If you're on Windows, then run: `npm run build-db-win`

    A `database.db` file should appear in the directory.

3.  **Start application**

    Run: `npm run start`

    There should be a `localhost` link to access the project.

## Additional Information

### Project Overview

This project is an Agile Software Development initiative for Bright Learning Academy, aiming to deliver a comprehensive and interactive learning experience.

### Technologies Used

The project utilises `Node.js` and its dependencies as seen in `package.json`:

```json
    "dependencies": {
        "ejs": "^3.1.10",
        "express": "^4.19.2",
        "express-session": "^1.18.0",
        "express-validator": "^7.2.0",
        "multer": "^1.4.5-lts.1",
        "sqlite3": "^5.1.7"
    },
    "devDependencies": {
        "jest": "^29.7.0",
        "nodemon": "^3.1.4",
        "supertest": "^7.0.0"
    }
```

### Contributing

Contributions are welcomed! Please follow the `CONTRIBUTING.md` guidelines.

### License

This project is licensed under the MIT License. See the LICENSE file for more details.
