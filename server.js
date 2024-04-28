const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
 
// MySQL client connection
const db = mysql.createPool({
    host: 'sql8.freesqldatabase.com',
    user: 'sql8702408',
    password: 'mwE5tbtFjU',
    database: 'sql8702408'
})
app.use(cors());
app.use(bodyParser.json());

app.post('/userLogin', (req, res) => {
    const { username, password } = req.body;

    // Updated query to select the 'id' column
    const query = "SELECT id FROM users WHERE username = ? AND password = ?";
    db.query(query, [username, password], (error, results) => {
        if (error) {
            console.error('Failed to fetch user:', error);
            return res.status(500).json({ message: "An error occurred. Please try again." });
        }

        // If a user with the username and password exists, authentication is successful
        if (results.length > 0) {
            // Use the 'id' column from the results
            const userId = results[0].id;
            return res.status(200).json({ userId: userId, message: "Login successful" });
        } else {
            // If no user is found with the username and password, return an error
            return res.status(401).json({ message: "Invalid username or password" });
        }
    });
});

// Example route for adding a user
app.post('/addUser', (req, res) => {
    const { username, password, email, phone, role, building, unit, apartment } = req.body;
    
    const query = 'INSERT INTO users (username, password, email, phone, role, building, unit, apartment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(query, [username, password, email, phone, role, building, unit, apartment], (error, results) => {
        if (error) {
            console.error("Failed to add user:", error);

            // Check if the error code corresponds to a duplicate entry
            if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
                return res.status(409).json({ message: "Username already exists." });
            } else {
                // For other types of errors, you might want to send a generic error message
                return res.status(500).json({ message: "An error occurred. Please try again." });
            }
        }
        res.status(200).json({ userId: results.insertId, message: "User added successfully" });
    });
});




app.post('/addProblem', (req, res) => {
    const { title, description, userId } = req.body;
    const status = 'true'; // Explicitly set the status to 'true'
    const query = 'INSERT INTO problems (title, description, status) VALUES (? ,?, ?, ?)';

    db.query(query, [title, description, userId, status], (error, results) => {
        if (error) {
            console.error('Failed to add problem:', error);
            return res.status(500).json({ error: "Failed to add problem" });
        }
        res.status(200).json({ problemId: results.insertId });
    });
});

// Route for fetching all problems
app.get('/viewProblems', (req, res) => {
    const query = `
        SELECT 
            problems.id, problems.title, problems.description, problems.status, problems.reported_at,
            users.username AS reportedBy, users.email, users.phone,
            users.building, users.unit
        FROM 
            problems 
            INNER JOIN users ON problems.userId = users.id
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Failed to fetch problems with details:', error);
            return res.status(500).json({ error: "Failed to fetch problems with details" });
        }
        res.status(200).json(results);
    });
});


// Route for fetching problems by a specific user
app.get('/userProblems/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query('SELECT * FROM problems WHERE userId = ?', [userId], (error, results) => {
        if (error) {
            console.error(`Failed to fetch problems for user ${userId}:`, error);
            return res.status(500).json({ error: `Failed to fetch problems for user ${userId}` });
        }
        res.status(200).json(results);
    });
});
app.post('/adminLogin', (req, res) => {
    const { username, password } = req.body;
    const query = "SELECT * FROM users WHERE username = ? AND password = ? AND role = 'admin'";
    db.query(query, [username, password], (error, results) => {
        if (error) {
            return res.status(500).json({ error: "An error occurred" });
        }
        if (results.length > 0) {
            // Login success
            return res.status(200).json({ message: "Login successful" });
        } else {
            // Login failed
            return res.status(401).json({ message: "Invalid credentials or not an admin" });
        }
    });
});

// Example route for fetching users
app.get('/viewUsers', (req, res) => {
    db.query('SELECT * FROM users', (error, results) => {
        if (error) {
            return res.status(500).json({ error });
        }
        res.status(200).json(results);
    });
});

// More routes can be added here

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
