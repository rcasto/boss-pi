var messengerServer = require('messenger').server;
var activityMonitor = require('./activityMonitor');
var config = require('./config.json');

/*
    Messages from clients are of the following form:
    {
        type: string, - The type of the message ex) 'activity'
        data: object    - Custom data object
    }
*/
function messageHandler(message) {
    console.log(`Message received from client: ${JSON.stringify(message)}`, typeof message);

    if (message.type === 'activity' && typeof message.data === 'object') {
        activityMonitor.report(message.data);
    }
}

var socketServer = messengerServer.create({
    messageHandler: messageHandler,
    port: config.port,
    host: config.host,
    keepAliveIntervalInMs: config.keepAliveIntervalInMs
});