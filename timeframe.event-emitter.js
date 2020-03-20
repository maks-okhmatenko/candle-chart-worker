const Utils = require('./utils');

const EventEmitter = require('events');
const connectionResolver = require('./connection');
const BaseRepository = require('./repositories/base.repository');
const _ = require('lodash');

class TimeframeEventEmitter {
    constructor() {
        this.events = {
            saveTimeframe: 'saveTimeframeEvent',
            update: 'updateEvent'
        };
        this.repository = new BaseRepository(connectionResolver);

        this.emitter = new EventEmitter();
        this.emitter.on(this.events.saveTimeframe, (timeframes, frame) => {
            setImmediate(async () => {
                console.time('save timeframes');
                try {
                    const symbols = _.keys(timeframes);
                    for (let i = 0; i < symbols.length; i += 1) {
                        const symbol = symbols[i];
                        const collection = await this.repository.getCollection(symbol, '1m');
                        await this.repository.insert(collection, _.extend({}, timeframes[symbol], {frame}));
                    }
                    console.timeEnd('save timeframes');
                } catch (e) {
                    console.log(e);
                }
            })
        });
    }

    saveTimeframes(timeframes, frame) {
        console.log('saveTimeframes', _.keys(timeframes).length, frame);
        this.emitter.emit(this.events.saveTimeframe, timeframes, frame);
    }

    notifyTimeframes(timeframes, frame){
        this.emitter.emit(this.events.update, Utils.convertTimeframes(timeframes, frame))
    }

    subscribeOnUpdate(cb) {
        this.emitter.on(this.events.update, cb);
    }
}

module.exports = new TimeframeEventEmitter();
