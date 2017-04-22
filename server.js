var messengerServer = require('messenger').server;
var config = require('./config.json');
var activityMonitor = require('./activityMonitor')(config.activityConfig);

function messageHandler(message) {
    if (!isValidMessage(message)) {
        return console.error(`Invalid message received from client: ${JSON.stringify(message)}`);
    }
    console.log(`Message received from client: ${JSON.stringify(message)}`);
    switch (message.type) {
        case 'activity':
            activityMonitor.report(message.data);
            break;
        default:
            console.error(`Unknown message received from client: ${JSON.stringify(message)}`);
            break;
    }
}

activityMonitor.on(activityMonitor.activityStatusEvent, (state) => {
    console.log(`Activity monitor report: ${ state > 0 ? 'on' : 'off' }`);
    socketServer.clients && socketServer.clients.forEach((client) => {
        client.send(JSON.stringify({
            type: 'activity',
            data: state
        }));
    });
});

/*
    Messages from clients are of the following form:
    {
        type: string, - The type of the message ex) 'activity'
        data: any     - Custom data object/string/whatever
    }
*/
function isValidMessage(message) {
    return message &&
           message.type &&
           typeof message.type === 'string';
}

var socketServer = messengerServer.create({
    messageHandler: messageHandler,
    port: config.port,
    host: config.host,
    keepAliveIntervalInMs: config.keepAliveIntervalInMs
});