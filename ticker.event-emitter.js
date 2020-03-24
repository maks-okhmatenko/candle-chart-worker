const Utils = require('./utils');
const EventEmitter = require('events');

class TickerEventEmitter {
    constructor() {
        this.events = {
            update: 'updateTickerEvent'
        };
        this.emitter = new EventEmitter();
    }

    notifyTickers(tickers) {
        this.emitter.emit(this.events.update, Utils.convertTickers(tickers))
    }

    subscribeOnUpdate(cb) {
        this.emitter.on(this.events.update, cb);
    }
}

module.exports = new TickerEventEmitter();
