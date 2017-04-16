var messengerServer = require('messenger').server;
var config = require('./config.json');

var activityMap = {};
var isActive = true;

function messageHandler(message) {
    console.log(`Message received from client: ${JSON.stringify(message)}`, typeof message);
}

function activityMonitor(event) {
    var activity = getActivity(event.type);
    clearActivityDebounce(event.type);
    activity.state = event.state;
    activity.activityDebounce = setTimeout(() => {
        clearDebounces(event.type);
        /*
            When the timer for one sensor reports an inactive period for the specified time, it does not
            mean the system turns off immediately.  Other sensor reports are checked for activity, if there is
            any the system stays.  Only once all sensors report inactivity will the system shut off
        */
        if (event.state === rpio.LOW) {
            activity.inactivityDebounce = setTimeout(() => {
                helpers.log(`${event.type} inactive for ${config.activityTimeoutInMs}ms`);
                clearInactivityDebounce(event.type);
                if (!isAnyActivity()) {
                    helpers.log(`All system components inactive, turning off`);
                    rpio.write(config.outputPin, activityState = rpio.LOW);
                }
            }, config.activityTimeoutInMs);
        }
        if (activityState === rpio.LOW) {
            rpio.write(config.outputPin, activityState = rpio.HIGH);
        }
    }, config.logDebounceTimeoutInMs);
}

function createActivity() {
    return {
        inactivityDebounce: null,
        activityDebounce: null,
        state: rpio.LOW
    };
}

function resetActivity(type) {
    if (type) {
        clearDebounces(type);
        activityMap[sensorType] = createActivity();
    } else {
        Object.keys(activityMap)
            .forEach((sensorType) => {
                clearDebounces(sensorType);
                activityMap[sensorType] = createActivity();
            });
    }
}

function getActivity(type) {
    return activityMap[type] || (activityMap[type] = createActivity());
}

function clearDebounces(type) {
    clearActivityDebounce(type);
    clearInactivityDebounce(type);
}

function clearActivityDebounce(type) {
    if (activityMap[type]) {
        clearTimeout(activityMap[type].activityDebounce);
        activityMap[type].activityDebounce = null;
    }
}

function isAnyActivity() {
    return Object.keys(activityMap)
        .some((sensorType) => activityMap[sensorType].state === rpio.HIGH ||
                              !!activityMap[sensorType].activityDebounce ||
                              !!activityMap[sensorType].inactivityDebounce);
}

var socketServer = messengerServer.create({
    messageHandler: messageHandler,
    port: config.port,
    host: config.host,
    keepAliveIntervalInMs: config.keepAliveIntervalInMs
});