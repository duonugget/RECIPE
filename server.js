const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const mysql = require('mysql');
const app = express();
const PORT = 3000;

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
    const ingredients = req.body.ingredients;
    const pythonScriptPath = "/home/potator/PycharmProjects/spark/Inverse-Cooking-Recipe-Generation-from-Food-Images-main/inversecooking-master/newData.py";

    exec(`python3 ${pythonScriptPath} ${ingredients}`, (error, stdout, stderr) => {
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


app.post('/createPersonalSuggest', (req, res) => {
    const userID = req.body.userID;
    const pythonScriptPath = "/home/potator/PycharmProjects/spark/Inverse-Cooking-Recipe-Generation-from-Food-Images-main/inversecooking-master/createPersonalSugget.py";

    exec(`python3 ${pythonScriptPath} ${userID}`, (error, stdout, stderr) => {
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
    try {
        const { queryType, sortType, filterType } = req.query;
        let collection;

        if (queryType.trim() === '') {
            console.log("default")
            collection = db.collection('result.json');
        } else if (queryType.trim() === 'Personal Suggestion') {
            await new Promise((resolve, reject) => {
                exec(`python3 /home/potator/PycharmProjects/spark/Inverse-Cooking-Recipe-Generation-from-Food-Images-main/inversecooking-master/personal_and_result.py`, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error executing Python script:', error);
                        reject(error);
                    } else {
                        console.log("persona");
                        collection = db.collection('personal&result');
                        resolve();
                    }
                });
            });
        } else if (queryType.trim() === 'Trending') {
            await new Promise((resolve, reject) => {
                exec(`python3 /home/potator/PycharmProjects/spark/Inverse-Cooking-Recipe-Generation-from-Food-Images-main/inversecooking-master/test.py`, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error executing Python script:', error);
                        reject(error);
                    } else {
                        console.log("trending");
                        collection = db.collection('trending&result');
                        resolve();
                    }
                });
            });
        } else {
            await new Promise((resolve, reject) => {
                exec(`python3 /home/potator/PycharmProjects/spark/Inverse-Cooking-Recipe-Generation-from-Food-Images-main/inversecooking-master/src/personal_trending.py`, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error executing Python script:', error);
                        reject(error);
                    } else {
                        console.log("both");
                        collection = db.collection('personal&trending&result');
                        resolve();
                    }
                });
            });
        }
        // const collection = db.collection('result.json');

        let sortOptions = {};
        const sortFields = sortType.trim().split(' ');
        if (sortType == '') {
        } else {
            for (let i = 0; i < sortFields.length; i += 2) {
                const fieldName = sortFields[i];
                const order = sortFields[i + 1] === 'ASC' ? 1 : -1;
                sortOptions[fieldName] = order;
            }
        }


        console.log('Sort Options:', sortOptions);
        console.log('Filter Options:', filterType);
        
        // switch (filterType.trim()) {
        //     case 'Breakfast':
        //         collection = collection.filter(item => item.MealType === 'Breakfast');
        //         break;
        //     case 'Lunch':
        //         collection = collection.filter(item => item.MealType === 'Lunch');
        //         break;
        //     case 'Dinner':
        //         collection = collection.filter(item => item.MealType === 'Dinner');
        //         break;
        //     case 'Dessert':
        //         collection = collection.filter(item => item.MealType === 'Dessert');
        //         break;
        //     case 'Beverage':
        //         collection = collection.filter(item => item.MealType === 'Other');
        //         break;
        //     default:
        //         break;
        // }

        let cursor;
        switch (filterType.trim()) {
            case 'Breakfast':
                cursor = collection.find({ MealType: 'Breakfast' });
                break;
            case 'Lunch':
                cursor = collection.find({ MealType: 'Lunch' });
                break;
            case 'Dinner':
                cursor = collection.find({ MealType: 'Dinner' });
                break;
            case 'Dessert':
                cursor = collection.find({ MealType: 'Dessert' });
                break;
            case 'Beverage':
                cursor = collection.find({ MealType: 'Other' });
                break;
            default:
                cursor = collection.find({});
                break;
        }

        // if (Object.keys(sortOptions).length > 0) {
        //     collection.sort((a, b) => {
        //         for (const field in sortOptions) {
        //             if (a[field] < b[field]) return -sortOptions[field];
        //             if (a[field] > b[field]) return sortOptions[field];
        //         }
        //         return 0;
        //     });
        // }

        const result = await cursor.sort(sortOptions).toArray();
        // Code to recommend diet
        res.json(result);
    } catch (err) {
        console.error('Error fetching data from MongoDB:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
