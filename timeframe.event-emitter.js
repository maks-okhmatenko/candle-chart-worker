const Utils = require('./utils');
const EventEmitter = require('events');
const connectionResolver = require('./connection');
const BaseRepository = require('./repository');
const _ = require('lodash');
const CONSTANTS = require('./constants');
const moment = require('moment');

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
        this.repository = new BaseRepository(connectionResolver);

        this.emitter = new EventEmitter();
        this.emitter.on(this.events.saveTimeframeM1, (timeframes, frame) => {
            if (!frame) return;
            setImmediate(async () => {
                const timer = 'save timeframes' + CONSTANTS.FRAME_TYPES.M1;
                console.time(timer);
                try {
                    const symbols = _.keys(timeframes);
                    for (let i = 0; i < symbols.length; i += 1) {
                        const symbol = symbols[i];
                        const collection = await this.repository.getCollection(symbol, CONSTANTS.FRAME_TYPES.M1);
                        await this.repository.upsert(collection, _.extend({}, timeframes[symbol], {frame}));
                    }
                    console.timeEnd(timer);
                    this.emitter.emit(this.events.saveTimeframeM5, symbols, frame);
                } catch (e) {
                    console.log(e);
                }
            })
        });
        this.emitter.on(this.events.saveTimeframeM5, (symbols, frame) => {
            if (!frame) return;
            setImmediate(async () => {
                const timer = 'save timeframes' + CONSTANTS.FRAME_TYPES.M5;
                console.time(timer);
                try {
                    const momentFrame = moment(frame * 1000);
                    const mm = _.toString(momentFrame.format('mm'));
                    const mm0 = _.toSafeInteger(mm[0]);
                    const mm1 = _.toSafeInteger(mm[1]);
                    let minutes = 0;
                    if (mm1 >= 5) {
                        minutes = 5;
                    }
                    const roundedFrameStart = momentFrame.minutes(_.toSafeInteger(`${mm0}${minutes}`)).unix();
                    const roundedFrameEnd = moment(roundedFrameStart * 1000).add(5, 'minutes').unix();
                    const timeframes = {};
                    for (let i = 0; i < symbols.length; i += 1) {
                        timeframes[symbols[i]] = await this.calculateSymbol(symbols[i], CONSTANTS.FRAME_TYPES.M1, CONSTANTS.FRAME_TYPES.M5, roundedFrameStart, roundedFrameEnd);
                    }
                    console.timeEnd(timer);
                    this.notifyTimeframes(timeframes, roundedFrameStart, CONSTANTS.FRAME_TYPES.M5);
                    this.emitter.emit(this.events.saveTimeframeM15, symbols, frame);
                } catch (e) {
                    console.log(e);
                }
            });
        });
        this.emitter.on(this.events.saveTimeframeM15, (symbols, frame) => {
            if (!frame) return;
            setImmediate(async () => {
                const timer = 'save timeframes' + CONSTANTS.FRAME_TYPES.M15;
                console.time(timer);
                try {
                    const momentFrame = moment(frame * 1000);
                    const mm = _.toSafeInteger(momentFrame.format('mm'));
                    let minutes;
                    if (mm >= 0 && mm < 15) {
                        minutes = 0;
                    } else if (mm >= 15 && mm < 30) {
                        minutes = 15;
                    } else if (mm >= 30 && mm < 45) {
                        minutes = 30;
                    } else {
                        minutes = 45;
                    }
                    const roundedFrameStart = momentFrame.minutes(minutes).unix();
                    const roundedFrameEnd = moment(roundedFrameStart * 1000).add(15, 'minutes').unix();
                    const timeframes = {};
                    for (let i = 0; i < symbols.length; i += 1) {
                        timeframes[symbols[i]] = await this.calculateSymbol(symbols[i], CONSTANTS.FRAME_TYPES.M5, CONSTANTS.FRAME_TYPES.M15, roundedFrameStart, roundedFrameEnd);
                    }
                    console.timeEnd(timer);
                    this.notifyTimeframes(timeframes, roundedFrameStart, CONSTANTS.FRAME_TYPES.M15);
                    this.emitter.emit(this.events.saveTimeframeM30, symbols, frame);
                } catch (e) {
                    console.log(e);
                }
            });
        });
        this.emitter.on(this.events.saveTimeframeM30, (symbols, frame) => {
            if (!frame) return;
            setImmediate(async () => {
                const timer = 'save timeframes' + CONSTANTS.FRAME_TYPES.M30;
                console.time(timer);
                try {
                    const momentFrame = moment(frame * 1000);
                    const mm = _.toSafeInteger(momentFrame.format('mm'));
                    let minutes;
                    if (mm >= 0 && mm < 30) {
                        minutes = 0;
                    } else {
                        minutes = 30;
                    }
                    const roundedFrameStart = momentFrame.minutes(minutes).unix();
                    const roundedFrameEnd = moment(roundedFrameStart * 1000).add(30, 'minutes').unix();
                    const timeframes = {};
                    for (let i = 0; i < symbols.length; i += 1) {
                        timeframes[symbols[i]] = await this.calculateSymbol(symbols[i], CONSTANTS.FRAME_TYPES.M15, CONSTANTS.FRAME_TYPES.M30, roundedFrameStart, roundedFrameEnd);
                    }
                    console.timeEnd(timer);
                    this.notifyTimeframes(timeframes, roundedFrameStart, CONSTANTS.FRAME_TYPES.M30);
                    this.emitter.emit(this.events.saveTimeframeH1, symbols, frame);
                } catch (e) {
                    console.log(e);
                }
            });
        });
        this.emitter.on(this.events.saveTimeframeH1, (symbols, frame) => {
            if (!frame) return;
            setImmediate(async () => {
                const timer = 'save timeframes' + CONSTANTS.FRAME_TYPES.H1;
                console.time(timer);
                try {
                    const momentFrame = moment(frame * 1000);
                    const roundedFrameStart = momentFrame.minutes(0).unix();
                    const roundedFrameEnd = moment(roundedFrameStart * 1000).add(1, 'hour').unix();
                    const timeframes = {};
                    for (let i = 0; i < symbols.length; i += 1) {
                        timeframes[symbols[i]] = await this.calculateSymbol(symbols[i], CONSTANTS.FRAME_TYPES.M30, CONSTANTS.FRAME_TYPES.H1, roundedFrameStart, roundedFrameEnd);
                    }
                    console.timeEnd(timer);
                    this.notifyTimeframes(timeframes, roundedFrameStart, CONSTANTS.FRAME_TYPES.H1);
                    this.emitter.emit(this.events.saveTimeframeH4, symbols, frame);
                } catch (e) {
                    console.log(e);
                }
            });
        });
        this.emitter.on(this.events.saveTimeframeH4, (symbols, frame) => {
            if (!frame) return;
            setImmediate(async () => {
                const timer = 'save timeframes' + CONSTANTS.FRAME_TYPES.H4;
                console.time(timer);
                try {
                    const momentFrame = moment(frame * 1000);
                    const HH = _.toSafeInteger(momentFrame.format('HH'));
                    let hours;
                    if (HH >= 0 && HH < 4) {
                        hours = 0;
                    } else if (HH >= 4 && HH < 8) {
                        hours = 4;
                    } else if (HH >= 8 && HH < 12) {
                        hours = 8;
                    } else if (HH >= 12 && HH < 16) {
                        hours = 12;
                    } else if (HH >= 16 && HH < 20) {
                        hours = 16;
                    } else {
                        hours = 20;
                    }
                    const roundedFrameStart = momentFrame.hours(hours).minutes(0).unix();
                    const roundedFrameEnd = moment(roundedFrameStart * 1000).add(4, 'hours').unix();
                    const timeframes = {};
                    for (let i = 0; i < symbols.length; i += 1) {
                        timeframes[symbols[i]] = await this.calculateSymbol(symbols[i], CONSTANTS.FRAME_TYPES.H1, CONSTANTS.FRAME_TYPES.H4, roundedFrameStart, roundedFrameEnd);
                    }
                    console.timeEnd(timer);
                    this.notifyTimeframes(timeframes, roundedFrameStart, CONSTANTS.FRAME_TYPES.H4);
                    this.emitter.emit(this.events.saveTimeframeD1, symbols, frame);
                } catch (e) {
                    console.log(e);
                }
            });
        });
        this.emitter.on(this.events.saveTimeframeD1, (symbols, frame) => {
            if (!frame) return;
            setImmediate(async () => {
                const timer = 'save timeframes' + CONSTANTS.FRAME_TYPES.D1;
                console.time(timer);
                try {
                    const momentFrame = moment(frame * 1000);
                    const roundedFrameStart = momentFrame.hours(0).minutes(0).unix();
                    const roundedFrameEnd = moment(roundedFrameStart * 1000).add(1, 'day').unix();
                    const timeframes = {};
                    for (let i = 0; i < symbols.length; i += 1) {
                        timeframes[symbols[i]] = await this.calculateSymbol(symbols[i], CONSTANTS.FRAME_TYPES.H4, CONSTANTS.FRAME_TYPES.D1, roundedFrameStart, roundedFrameEnd);
                    }
                    console.timeEnd(timer);
                    this.notifyTimeframes(timeframes, roundedFrameStart, CONSTANTS.FRAME_TYPES.D1);
                } catch (e) {
                    console.log(e);
                }
            });
        });
    }

    saveTimeframesM1(timeframes, frame) {
        console.log('saveTimeframesM1', _.keys(timeframes).length, frame);
        this.emitter.emit(this.events.saveTimeframeM1, timeframes, frame);
    }

    notifyTimeframes(timeframes, frame, frameType) {
        this.emitter.emit(this.events.update, Utils.convertTimeframes(timeframes, frame, frameType))
    }

    subscribeOnUpdate(cb) {
        this.emitter.on(this.events.update, cb);
    }

    async calculateSymbol(symbol, baseFrameType, currentFrameType, frameStart, frameEnd) {
        const baseCollection = await this.repository.getCollection(symbol, baseFrameType);
        const currentCollection = await this.repository.getCollection(symbol, currentFrameType);
        const symbolListObject = await this.repository.getAll(baseCollection, {
            query: {frame: {$gte: frameStart, $lt: frameEnd}},
            sort: {property: 'frame', direction: 1}
        });
        const startRecord = {open: '0', high: '0', low: '0', close: '0'};
        if (symbolListObject && symbolListObject.results.length) {
            const symbolList = symbolListObject.results;
            const first = _.first(symbolList);
            const record = _.extend({}, startRecord, {
                open: first.open,
                high: first.high,
                low: first.low,
                close: _.last(symbolList).close
            });
            _.each(symbolList, (model) => {
                const prevHigh = _.toNumber(_.get(record, 'high'));
                const prevLow = _.toNumber(_.get(record, 'low'));
                const currentHigh = _.toNumber(model.high);
                const currentLow = _.toNumber(model.low);
                if (currentHigh > prevHigh) {
                    _.set(record, ['high'], model.high);
                }
                if (currentLow < prevLow) {
                    _.set(record, ['low'], model.low);
                }
            });
            await this.repository.upsert(currentCollection, _.extend(record, {frame: frameStart}));
            return record;
        }
        await this.repository.upsert(currentCollection, _.extend(startRecord, {frame: frameStart}));
        return startRecord;
    }
}

module.exports = new TimeframeEventEmitter();
