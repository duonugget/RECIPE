const kafka = require('kafka-node');
const mysql = require('mysql');


const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'potator', 
    password: '212614', 
    database: 'dishesdb' 
});

connection.connect();

const consumer = new kafka.Consumer(
    kafkaClient,
    [{ topic: 'topic-kafka', partition: 0 }],
    { autoCommit: true,
        fetchMaxWaitMs: 10000,
        fetchMinBytes: 1,
        fetchMaxBytes: 100* 1024 * 1024
     }
);

// const batchInterval = 24 * 60 * 60 * 1000;
const batchInterval = 5000;
let messagesBatch = [];

// Listen for messages
consumer.on('message', (message) => {
    const data = JSON.parse(message.value);
    const { userID, mealId, rating } = data.payload;
    messagesBatch.push({ userID, mealId, authorID: 1, rating });
    // messagesBatch.push(message);
});

// Process the batch at regular intervals
setInterval(() => {
    // console.log(messagesBatch);
    messagesBatch.forEach(message => {
        const userID = message.userID;
        const mealId = Number(message.mealId);
        const authorID = message.authorID;
        const rating = Number(message.rating);

        const query = 'INSERT INTO REVIEWS (UserId, RecipeId, AuthorId, Rating) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE Rating = VALUES(Rating)';
        connection.query(query, [userID, mealId, authorID, rating], (err, results, fields) => {
            if (err) {
                console.error('Error inserting message into database:', err);
            } else {
                // console.log('Inserted message into database:', results);
            }
        });
    });
    messagesBatch = [];
}, batchInterval);

// let messageBuffer = [];

// function fetchMessages() {
//     consumer.fetch((err, messages) => {
//         if (err) {
//             console.error('Error fetching messages:', err);
//             return;
//         }

//         // Process fetched messages
//         messages.forEach((message) => {
//             console.log('Received message:', message);
//             const data = JSON.parse(message.value);
//             const { userID, mealId, rating } = data.payload;
//             messageBuffer.push({ userID, mealId, authorID: 1, rating });
//             lastOffset = message.offset + 1; // Update last offset
//         });
//         console.log(messageBuffer);
//         messageBuffer = [];
//     });
// }

// setInterval(fetchMessages, 10000);
consumer.on('error', (err) => {
    console.error('Consumer error:', err);
});
