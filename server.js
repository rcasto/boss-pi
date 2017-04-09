var messengerServer = require('messenger').server;
var config = require('./config.json');

function messageHandler(message) {
    console.log(`Message received from client: ${message}`);
}

var socketServer = messengerServer.create({
    messageHandler: messageHandler,
    port: config.port,
    host: config.host
});