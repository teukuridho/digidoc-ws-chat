const { configDotenv } = require("dotenv");
const { createServer } = require('https');
const fs = require('fs');
const { WebSocket, WebSocketServer } = require('ws');
const express = require('express');
const app = express();

/**
 * @type {Array<WebSocket>}
 */
const sockets = [];

/**
 * Entry point
 */
function main() {
    // init dot env
    configDotenv();

    // create https server
    const httpsServer = createServer(
        {
            key: process.env.SSL_KEY_PATH ? fs.readFileSync(process.env.SSL_KEY_PATH) : null,
            cert: process.env.SSL_CERT_PATH ? fs.readFileSync(process.env.SSL_CERT_PATH) : null,
            ca: process.env.SSL_CA_PATH ? fs.readFileSync(process.env.SSL_CA_PATH) : null,
        }, 
        app
    )

    // listens https server
    httpsServer.listen(process.env.PORT, () => {
        console.log(`HTTPS Started on ${process.env.PORT}`)
    });

    // create websocket server
    const wss = new WebSocketServer({
        server: httpsServer
    });

    // handles on connection
    wss.on("connection", (socket, request) => {
        // push to sockets list
        sockets.push(socket);

        // handles error
        socket.on("error", (error) => {
            console.log(error)
        })

        // handles on message
        socket.on("message", (data) => {
            // convert to string text
            const text = data.toString();

            // convert to json
            var json;
            try {
                json = JSON.parse(text);
            }
            catch(ex) {
                console.log(`Received non-JSON!; ${text}`)
                return;
            }

            // compose message
            const message = {
                'token_chat': json.token_chat,
                'sender_id': json.sender_id,
                'name': json.name,
                'message': json.message,
                'date': json.message
            }

            // send message to all sockets
            for(const socket of sockets) {
                socket.send(JSON.stringify(message));
            }
            
        })
    })
}

// executes entry point
main();