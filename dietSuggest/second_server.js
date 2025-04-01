const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const mysql = require('mysql');
const app = express();
const PORT = 3080;
const { MongoClient } = require('mongodb');
const { Console } = require('console');
const url = 'mongodb://localhost:27017';
const dbName = 'local';
let db;
// Connect to MongoDB and set the global db variable
async function connectToMongoDB() {
    try {
     const client = await MongoClient.connect(url, {});
        console.log('Connected to MongoDB');
        db = client.db(dbName);
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1); // Exit the process if the connection fails
    }
}
connectToMongoDB();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'potator', 
    password: '212614', 
    database: 'dishesdb' 
});

connection.connect();

app.use(cors());
app.use(bodyParser.json());

app.post('/login', (req, res) => {
    // Extract username and password from request body
    const { username, password } = req.body;  // Match this with client-side key names
    // SQL query to check username and password
    const query = `SELECT UserID FROM login WHERE UserName = ? AND UserPassWord = ?`;

    // Execute the query with provided parameters
    connection.query(query, [username, password], (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        console.log('Query results:', results); // Log the query results
        if (results.length === 1) {
            // User authenticated successfully
            res.json({ userID: results[0].UserID });
        } else {
            // Incorrect username or password
            res.status(401).json({ error: 'Incorrect username or password' });
        }
    });
});


app.put('/saving', (req, res) => {
    console.log('Received POST request at /saving endpoint');
    const { age, weight, height, activityLevel, userID } = req.body;
    console.log('Received data:', { age, weight, height, activityLevel, userID });

    // Insert data into MySQL database
    const query = 'UPDATE info SET Age = ?, Weight = ?, Height = ?, Activity_level = ? WHERE UserID = ?';
    connection.query(query, [age, weight, height, activityLevel, userID], (error, results) => {
        if (error) {
            console.error('Error saving data:', error);
            res.status(500).send('Error saving data');
        } else {
            console.log('Data saved successfully:', results);
            res.status(200).send('Data saved successfully');
        }
    });
});


// Endpoint to run Python script with ingredients as parameter
app.post('/run-script', (req, res) => {
    const UserId = req.body.UserId;
    const Criteria = req.body.Criteria;
    const Asc = req.body.Asc;
    console.log({UserId,Criteria,Asc});
    const pythonScriptPath = "/home/potator/PycharmProjects/spark/Inverse-Cooking-Recipe-Generation-from-Food-Images-main/inversecooking-master/createDiet.py";

    exec(`python3 ${pythonScriptPath} ${UserId} ${Criteria} ${Asc}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing script: ${error.message}`);
            return res.status(500).send('Error executing script');
        }
        if (stderr) {
            console.error(`Script error: ${stderr}`);
            return res.status(500).send('Script error');
        }

        console.log(`Script output: ${stdout}`);
        
        // Send a notice indicating the script completion
        const responseData = JSON.parse(stdout);
        responseData.notice = "Script execution completed.";
        
        res.status(200).json(responseData);
    });
});


// Endpoint to serve the JSON file
app.get('/result', async (req, res) => {
     try{const collection = db.collection('personalDiet');
        let cursor;
        cursor = collection.find({}).sort({ index: 1 });
        const result = await cursor.toArray();
        res.json(result);
    }catch (err) {
        console.error('Error fetching data from MongoDB:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
