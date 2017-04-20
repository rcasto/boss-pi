var events = require('events');

class ActivityMonitor extends events.EventEmitter {
    activityMap;
    constructor() {
        this.activityMap = {};
        this.isActive = true;
    }
    /*
        activity is of the following form:
        {
            type: string,  - Indicates the sub-type of message ex) 'light'
            state: number  - 0 or 1, indicating off or on respectively
        }
    */
    report(activity) {
        if (!activity || typeof activity !== 'object') {
            return;
        }
        // activity stuff here
    }
    isAnyActivity() {

    }
}

/* Creates a Singleton instance to manage activity */
module.exports = new ActivityMonitor();