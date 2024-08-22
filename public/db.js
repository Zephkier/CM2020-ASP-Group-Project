// Import and setup modules
const sqlite3 = require("sqlite3").verbose();

// Items in the global namespace are accessible throught out the node application
const db = new sqlite3.Database("./database.db", (err) => {
    if (err) {
        // If cannot connect to database, then bail out
        console.error(err);
        process.exit(1);
    } else {
        // Tell SQLite to pay attention to foreign key constraints
        db.run("PRAGMA foreign_keys=ON");
        console.log("Database connected");
    }
});

// Export module containing the following so external files can access it
module.exports = { db };
