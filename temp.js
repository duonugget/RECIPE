const WebSocket = require('ws');
const { MongoClient } = require('mongodb');
const kafka = require('kafka-node');
const fs = require('fs');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 3001 });
const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new kafka.Producer(kafkaClient);
const url = 'mongodb://localhost:27017';
const dbName = 'local';

let db;
// Connect to MongoDB and set the global db variable
async function connectToMongoDB() {
    try {
        const client = await MongoClient.connect(url, {});
        console.log('Connected to MongoDB');
        db = client.db(dbName);
        startKafkaConsumer(); // Start the Kafka consumer only after MongoDB is connected
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1); // Exit the process if the connection fails
    }
}
connectToMongoDB();

// Handle Kafka producer ready state
producer.on('ready', () => {
    console.log('Kafka Producer is connected and ready.');
});

// Handle Kafka producer errors
producer.on('error', (err) => {
    console.error('Producer error:', err);
});

const aggregateRatings = {};

// Function to start the Kafka consumer
function startKafkaConsumer() {
    const consumer = new kafka.Consumer(
        kafkaClient,
        [{ topic: 'topic-kafka', partition: 0 }],
        { autoCommit: true }
    );

    consumer.on('message', (message) => {
        const data = JSON.parse(message.value);
        const { userID, mealId, rating } = data.payload;
        if (rating < 3) {
            return;
        }
        // Update aggregate ratings for the meal ID
        if (!aggregateRatings[mealId]) {
            aggregateRatings[mealId] = [];
        }
        aggregateRatings[mealId].push(rating);
    });

    consumer.on('error', (err) => {
        console.error('Consumer error:', err);
    });

    setInterval(async () => {
        try {
            if (!db) {
                console.log('MongoDB not connected yet. Retrying...');
                return;
            }

            const mealIDs = Object.keys(aggregateRatings).map(id => parseInt(id));

            const collection = db.collection('notice_me.json');
            const result = await collection.find({ RecipeId: { $in: mealIDs } }).toArray();

            if (result.length > 0) {
                // Add totalRatings field to each document
                result.forEach(doc => {
                    const ratings = aggregateRatings[doc.RecipeId] || [];
                    doc.totalRatings = ratings.length;
                });

                // Sort documents by totalRatings in descending order
                result.sort((a, b) => b.totalRatings - a.totalRatings);

                await db.collection('trending').deleteMany({});
                await db.collection('trending').insertMany(result);
                console.log('Data saved to trending collection');
            }

        } catch (err) {
            console.error('Error in interval task:', err);
        }
    }, 1000);
}


// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Handle messages from the client
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const { userID, mealId, rating } = data.payload;
        console.log({ userID, mealId, rating });
        // Produce message to Kafka topic
        const kafkaPayloads = [
            { topic: 'topic-kafka', messages: JSON.stringify({ payload: { userID, mealId, rating } }) }
        ];

        producer.send(kafkaPayloads, (err, data) => {
            if (err) {
                console.error('Error sending message to Kafka:', err);
                ws.send(JSON.stringify({ type: 'error', payload: 'Failed to send message to Kafka' }));
            } else {
                ws.send(JSON.stringify({ type: 'success', payload: 'Message sent to Kafka' }));
            }
        });

        // Here you can add more logic to handle different types of messages if needed
    });

    // Handle WebSocket errors
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });

    // Handle WebSocket close event
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
