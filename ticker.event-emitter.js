const Utils = require('./utils');
const EventEmitter = require('events');
const repository = require('./repository');
const _ = require('lodash');

class TickerEventEmitter {
    constructor() {
        this.events = {
            update: 'updateTickerEvent',
            save: 'saveTickerEvent'
        };
        this.emitter = new EventEmitter();
        this.emitter.on(this.events.save, (tickers) => {
            if (!_.isArray(tickers)) {
                return;
            }
            setImmediate(async () => {
                try {
                    const timer = Utils.getTickersTimerLabel();
                    console.time(timer);
                    const collection = await repository.getTickerCollection();
                    for (let i = 0; i < tickers.length; i++) {
                        await repository.upsertTicker(collection, _.extend({}, tickers[i]));
                    }
                    console.timeEnd(timer);
                } catch (e) {
                    console.log(e);
                }
            });
        });
    }

    notifyTickers(tickers) {
        this.emitter.emit(this.events.update, Utils.convertTickers(tickers))
    }

    subscribeOnUpdate(cb) {
        this.emitter.on(this.events.update, cb);
    }

    saveTickers(tickers) {
        this.emitter.emit(this.events.save, Utils.convertTickers(tickers))
    }
}

module.exports = new TickerEventEmitter();
