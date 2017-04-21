var events = require('events');

class ActivityMonitor extends events.EventEmitter {
    activityMap;
    config;
    constructor(config) {
        this.activityMap = {};
        this.isActive = false;
        this.config = config;
        this.config.inactivityTimeoutInMs = 
            this.config.inactivityTimeoutInMs || 1800000; // defaults to 30 minutes
    }
    /*
        activity is of the following form:
        {
            type: string,  - Indicates the sub-type of message ex) 'light'
            state: number  - 0 or 1, indicating off or on respectively
        }
    */
    report(activity) {
        if (!isValidActivity(activity)) {
            return console.error(`Invalid activity reported: ${JSON.stringify(activity)}`);
        }
        if (!this.activityMap[activity.type]) {
            this.activityMap[activity.type] = {
                state: activity.state,
                inactivityTimeout: null
            };
        }
        // check if this report made it active
        if (!this.isActive && this.isAnyActivity()) {
            this.isActive = true;
            this.emit(this.activityStatusEvent, 1);
        }
        if (activity.state > 0) { // potential transfer to high
            _clearActivityTimeout(this.activityMap[activity.type]);
        }
        this.activityMap[activity.type].inactivityTimeout = setTimeout(() => {
            _clearActivity(this.activityMap[activity.type]);
            // check if everything has now turned off
            if (!this.isAnyActivity()) {
                this.isActive = false;
                this.emit(this.activityStatusEvent, 0);
            }
        }, this.config.inactivityTimeoutInMs);
    }
    isValidActivity(activity) {
        return !!(
            activity &&
            activity.type &&
            typeof activity.type === 'string' &&
            activity.state &&
            typeof activity.state === 'number'
        );
    }
    isAnyActivity() {
        return Object.values(this.activityMap)
            .some((activity) => activity.state > 0 && activity.inactivityTimeout);
    }
    clearActivity(type) {
        if (type) {
            _clearActivity(this.activityMap[type]);
        }
        Object.values(this.activityMap)
            .forEach((activity) => _clearActivity(activity));
    }
}
ActivityMonitor.prototype.activityStatusEvent = 'ActivityStatus';

function _clearActivityTimeout(activity) {
    clearTimeout(activity.inactivityTimeoutInMs);
    activity.inactivityTimeoutInMs = null;
}

function _clearActivity(activity) {
    activity.state = 0;
    _clearActivityTimeout(activity);
}

/* Creates a Singleton instance to manage activity */
module.exports = (config) => new ActivityMonitor(config);