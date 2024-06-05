const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); 
 
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.source === 'pexels') {
                handlePexelsMessage(parsedMessage.data);
            } else {
              console.log(`Received message from client: ${message}`);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

function handlePexelsMessage(data) {
  console.log('Received message from Pexels API:', data);
}

server.listen(3000, () => {
    console.log("WebSocket server is listening on port 3000");
});
