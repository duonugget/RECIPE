const WebSocket = require('ws');
const simulateUser = async (userID) => {
    const ws = await new WebSocket('ws://localhost:3001');
    ws.onopen = async() => {
        console.log('WebSocket connection established');
        for (let i = 0; i < 50; i++) {
            const mealId = String(Math.floor(Math.random() * 35790));
            const rating = String(Math.floor(Math.random() * 5));
            
            const messagePayload = {
                userID,
                mealId,
                rating
            };
        
            const message = JSON.stringify({ payload: messagePayload });
        
            ws.send(message);
        
            const waitTime = Math.floor(Math.random() * 70000) + 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        ws.close();
        resolve();
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'error':
                break;
            case 'success':
                break;
            case 'error':
                break;
            default:
                console.error('Unknown message type');
        }
    };
}

const numUsers = 10000;
const users = [];
for (let i = 1; i < numUsers; i++) {
    users.push(simulateUser(i));
}

Promise.all(users)
    .then(() => console.log('All users completed their tasks.'))
    .catch(error => console.error('Error:', error));