const Utils = require('./modules/utils');
const EventEmitter = require('events');
const repository = require('./repository');
const _ = require('lodash');
const CONSTANTS = require('./constants');
const TimeUtils = require('./modules/time-utils');

class TimeframeEventEmitter {
    constructor() {
        this.events = {
            saveTimeframeM1: 'saveTimeframeM1Event',
            saveTimeframeM5: 'saveTimeframeM5Event',
            saveTimeframeM15: 'saveTimeframeM15Event',
            saveTimeframeM30: 'saveTimeframeM30Event',
            saveTimeframeH1: 'saveTimeframeH1Event',
            saveTimeframeH4: 'saveTimeframeH4Event',
            saveTimeframeD1: 'saveTimeframeD1Event',
            update: 'updateEvent'
        };
        this.emitter = new EventEmitter();
        this.emitter.on(this.events.saveTimeframeM1, (timeframes, frame) => {
            if (!frame) return;
            setImmediate(async () => {
                try {
                    const timer = Utils.getTimeframesTimerLabel(CONSTANTS.FRAME_TYPES.M1);
                    console.time(timer);
                    const symbols = _.keys(timeframes);
                    for (let i = 0; i < symbols.length; i += 1) {
                        const symbol = symbols[i];
                        const collection = await repository.getTimeframeCollection(symbol, CONSTANTS.FRAME_TYPES.M1);
                        await repository.upsertTimeframe(collection, _.extend({}, timeframes[symbol], {frame}));
                    }
                    console.timeEnd(timer);
                    this.emitter.emit(this.events.saveTimeframeM5, symbols, frame);
                } catch (e) {
                    console.log(e);
                }
            })
        });
        this.emitter.on(this.events.saveTimeframeM5, (symbols, frame) => {
            this.saveTimeframeEvent(symbols, frame, CONSTANTS.FRAME_TYPES.M1, CONSTANTS.FRAME_TYPES.M5, this.events.saveTimeframeM15);
        });
        this.emitter.on(this.events.saveTimeframeM15, (symbols, frame) => {
            this.saveTimeframeEvent(symbols, frame, CONSTANTS.FRAME_TYPES.M5, CONSTANTS.FRAME_TYPES.M15, this.events.saveTimeframeM30);
        });
        this.emitter.on(this.events.saveTimeframeM30, (symbols, frame) => {
            this.saveTimeframeEvent(symbols, frame, CONSTANTS.FRAME_TYPES.M15, CONSTANTS.FRAME_TYPES.M30, this.events.saveTimeframeH1);
        });
        this.emitter.on(this.events.saveTimeframeH1, (symbols, frame) => {
            this.saveTimeframeEvent(symbols, frame, CONSTANTS.FRAME_TYPES.M30, CONSTANTS.FRAME_TYPES.H1, this.events.saveTimeframeH4);
        });
        this.emitter.on(this.events.saveTimeframeH4, (symbols, frame) => {
            this.saveTimeframeEvent(symbols, frame, CONSTANTS.FRAME_TYPES.H1, CONSTANTS.FRAME_TYPES.H4, this.events.saveTimeframeD1);
        });
        this.emitter.on(this.events.saveTimeframeD1, (symbols, frame) => {
            this.saveTimeframeEvent(symbols, frame, CONSTANTS.FRAME_TYPES.H4, CONSTANTS.FRAME_TYPES.D1);
        });
    }

    saveAllTimeframes(timeframes, frame) {
        console.log('saveAllTimeframes', _.keys(timeframes).length, frame);
        this.emitter.emit(this.events.saveTimeframeM1, timeframes, frame);
    }

    notifyTimeframes(timeframes, frame, frameType) {
        this.emitter.emit(this.events.update, Utils.convertTimeframes(timeframes, frame, frameType))
    }

    subscribeOnUpdate(cb) {
        this.emitter.on(this.events.update, cb);
    }

    saveTimeframeEvent(symbols, frame, baseFrameType, currentFrameType, nextEvent) {
        if (!frame) return;
        setImmediate(async () => {
            try {
                const timer = Utils.getTimeframesTimerLabel(currentFrameType);
                console.time(timer);
                const {start, end} = TimeUtils.getTimeframePeriod(currentFrameType, frame);
                for (let i = 0; i < symbols.length; i += 1) {
                    await this.calculateSymbol(symbols[i], baseFrameType, currentFrameType, start, end);
                }
                console.timeEnd(timer);
                if (nextEvent) {
                    this.emitter.emit(nextEvent, symbols, frame);
                }
            } catch (e) {
                console.log(e);
            }
        });
    }

    async calculateSymbol(symbol, baseFrameType, currentFrameType, frameStart, frameEnd) {
        const baseCollection = await repository.getTimeframeCollection(symbol, baseFrameType);
        const currentCollection = await repository.getTimeframeCollection(symbol, currentFrameType);
        const symbolListObject = await repository.getAll(baseCollection, {
            query: {frame: {$gte: frameStart, $lt: frameEnd}},
            sort: {property: 'frame', direction: 1}
        });
        const symbolList = _.get(symbolListObject, 'results', []);
        const record = TimeUtils.calculateSymbol(symbolList);
        await repository.upsertTimeframe(currentCollection, _.extend(record, {frame: frameStart}));
        return record;
    }
}

module.exports = new TimeframeEventEmitter();
