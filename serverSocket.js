const WebSocket = require('ws');
const MongoClient = require('mongodb').MongoClient;
const kafka = require('kafka-node');
const fs = require('fs');
// Create a WebSocket server
const wss = new WebSocket.Server({ port: 3001 });
const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new kafka.Producer(kafkaClient);
const url = 'mongodb://localhost:27017';
const dbName = 'local';

let db
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.error('Failed to connect to MongoDB:', err);
        return;
    }

    console.log('Connected to MongoDB');
    const db = client.db(dbName);
})
// Handle Kafka producer ready state
producer.on('ready', () => {
    console.log('Kafka Producer is connected and ready.');
});

// Handle Kafka producer errors
producer.on('error', (err) => {
    console.error('Producer error:', err);
});

const aggregateRatings = {};

// Handle Kafka consumer
const consumer = new kafka.Consumer(
    kafkaClient,
    [{ topic: 'topic-kafka', partition: 0 }],
    { autoCommit: true }
);

consumer.on('message', (message) => {
    const data = JSON.parse(message.value);
    const mealID = data.mealID;
    if (data.rating < 3) {
        retturn;
    }
    // Update aggregate ratings for the meal ID
    if (!aggregateRatings[mealID]) {
        aggregateRatings[mealID] = [];
    }
    aggregateRatings[mealID].push(data.rating);

});

setInterval(() => {
    // Filter and sort aggregated ratings based on total count of rating > 3 for each meal ID
    const sortedMealIDs = Object.keys(aggregateRatings)
        .sort((a, b) => aggregateRatings[b].length - aggregateRatings[a].length); // Sort descending by total count of ratings

    console.log('Sorted meal IDs with total rating more than 3:', sortedMealIDs);
    const collection = db.collection('notice_me.json');
    collection.find({ mealID: { $in: sortedMealIDs } }).toArray((err, result) => {
        if (err) {
            console.error('Error querying recipe data:', err);
            client.close();
            return;
        }
        const jsonData = JSON.stringify(result, null, 2);
        db.collection("trending").save(data, function(error, record){
            if (error) throw error;
            console.log("data saved");
            
            });
    });
}, 5000);

consumer.on('error', (err) => {
    console.error('Consumer error:', err);
});

// Function to write messages to a text file (for demonstration purposes)
function writeToTextFile(data) {
    const text = JSON.stringify(data);
    fs.appendFile('/home/potator/Documents/kafka_messages.txt', `${text}\n`, (err) => {
        if (err) throw err;
        console.log('Message saved to kafka_messages.txt');
    });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Handle messages from the client
    ws.on('message', (message) => {
        const data = message;

        // Produce message to Kafka topic
        const kafkaPayloads = [
            { topic: 'topic-kafka', messages: data }
        ];

        producer.send(kafkaPayloads, (err, data) => {
            if (err) {
                console.error('Error sending message to Kafka:', err);
                ws.send(JSON.stringify({ type: 'error', payload: 'Failed to send message to Kafka' }));
            } else {
                console.log('Message sent to Kafka:', data);
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
