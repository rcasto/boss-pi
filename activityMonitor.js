var events = require('events');

class ActivityMonitor extends events.EventEmitter {
    constructor(config) {
        super();

        this.activityMap = {};
        this.isActive = false;
        this.config = config;
        this.config.inactivityTimeoutInMs = 
            this.config.inactivityTimeoutInMs || 1800000; // defaults to 30 minutes

        process.on('exit', () => this.clearActivity());
        process.on('SIGINT', () => this.clearActivity());
    }
    /*
        activity is of the following form:
        {
            type: string,  - Indicates the sub-type of message ex) 'light'
            state: number  - 0 or 1, indicating off or on respectively
        }
    */
    report(activity) {
        if (!this.isValidActivity(activity)) {
            return console.error(`Invalid activity reported: ${JSON.stringify(activity)}`);
        }
        if (!this.activityMap[activity.type]) {
            this.activityMap[activity.type] = {
                state: 0,
                inactivityTimeout: null
            };
        }
        this.activityMap[activity.type].state = activity.state;
        // check if this report made it active
        if (!this.isActive && this.isAnyActivity()) {
            this.isActive = true;
            this.emit(this.activityStatusEvent, 1);
        }
        _clearActivityTimeout(this.activityMap[activity.type]);
        this.activityMap[activity.type].inactivityTimeout = setTimeout(function _inactivityCheck() {
            if (this.activityMap[activity.type].state > 0) {
                this.activityMap[activity.type].inactivityTimeout = 
                    setTimeout(_inactivityCheck.bind(this), this.config.inactivityTimeoutInMs);
            } else {
                _clearActivity(this.activityMap[activity.type]);
                // check if everything has now turned off
                if (!this.isAnyActivity()) {
                    this.isActive = false;
                    this.emit(this.activityStatusEvent, 0);
                }
            }
        }.bind(this), this.config.inactivityTimeoutInMs);
    }
    isValidActivity(activity) {
        return !!(
            activity &&
            activity.type &&
            typeof activity.type === 'string' &&
            typeof activity.state === 'number'
        );
    }
    isAnyActivity() {
        return Object.values(this.activityMap)
            .some((activity) => activity.state > 0 || activity.inactivityTimeout);
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
    clearTimeout(activity.inactivityTimeout);
    activity.inactivityTimeout = null;
}

function _clearActivity(activity) {
    activity.state = 0;
    _clearActivityTimeout(activity);
}

/* Creates a Singleton instance to manage activity */
module.exports = (config) => new ActivityMonitor(config);