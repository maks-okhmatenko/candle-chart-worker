const NodeCache = require("node-cache");
const {FRAME_TYPES} = require('./constants');
const _ = require('lodash');
const TimeUtils = require('./modules/time-utils');

class MemoryCache {
    constructor() {
        _.each(_.keys(FRAME_TYPES), (frameType) => {
            this[frameType] = {};
        });
    }

    set(type, symbol, timestamp, value) {
        if (!this[type][symbol]) {
            this[type][symbol] = new NodeCache(this.getOptionsByType(type));
        }
        this[type][symbol].set(timestamp, value);
    }

    get(type, symbol, timestamp) {
        if (this[type] && this[type][symbol]) {
            return this[type][symbol].get(timestamp);
        }
    }

    getAllSymbols(type, timestamp) {
        if (this[type]) {
            const {start} = TimeUtils.getTimeframePeriod(type, timestamp);
            const result = {};
            _.each(_.keys(this[type]), (symbol) => {
                const symbolCache = this.get(type, symbol, start);
                if (symbolCache) {
                    result[symbol] = symbolCache;
                }
            });
            return {timestamp: start, result};
        }
        return {};
    }

    saveAllSymbols(symbol, timestamp, timeframeM1) {
        this.set(FRAME_TYPES.M1, symbol, timestamp, timeframeM1);

        const {timestamp: startM5, record: recordM5} = this.prepareCacheForFrameType(FRAME_TYPES.M1, FRAME_TYPES.M5, symbol, timestamp);
        recordM5 && this.set(FRAME_TYPES.M5, symbol, startM5, recordM5);

        const {timestamp: startM15, record: recordM15} = this.prepareCacheForFrameType(FRAME_TYPES.M5, FRAME_TYPES.M15, symbol, timestamp);
        recordM15 && this.set(FRAME_TYPES.M15, symbol, startM15, recordM15);

        const {timestamp: startM30, record: recordM30} = this.prepareCacheForFrameType(FRAME_TYPES.M15, FRAME_TYPES.M30, symbol, timestamp);
        recordM30 && this.set(FRAME_TYPES.M30, symbol, startM30, recordM30);

        const {timestamp: startH1, record: recordH1} = this.prepareCacheForFrameType(FRAME_TYPES.M30, FRAME_TYPES.H1, symbol, timestamp);
        recordH1 && this.set(FRAME_TYPES.H1, symbol, startH1, recordH1);

        const {timestamp: startH4, record: recordH4} = this.prepareCacheForFrameType(FRAME_TYPES.H1, FRAME_TYPES.H4, symbol, timestamp);
        recordH4 && this.set(FRAME_TYPES.H4, symbol, startH4, recordH4);

        const {timestamp: startD1, record: recordD1} = this.prepareCacheForFrameType(FRAME_TYPES.H4, FRAME_TYPES.D1, symbol, timestamp);
        recordD1 && this.set(FRAME_TYPES.D1, symbol, startD1, recordD1);
    }

    prepareCacheForFrameType(baseFrameType, currentFrameType, symbol, timestamp) {
        const {start, end} = TimeUtils.getTimeframePeriod(currentFrameType, timestamp);
        let record = null;
        if (this[baseFrameType] && this[baseFrameType][symbol]) {
            const keysList = _.filter(_.sortBy(this[baseFrameType][symbol].keys()), (timestamp) => {
                return timestamp >= start && timestamp < end;
            });
            const symbolList = _.map(keysList, key => this.get(baseFrameType, symbol, key));
            if (symbolList.length) {
                record = TimeUtils.calculateSymbol(symbolList);
            }
        }
        return {timestamp: start, record};
    }

    getOptionsByType(type) {
        switch (type) {
            case FRAME_TYPES.M1:
                return {stdTTL: 400};
            case FRAME_TYPES.M5:
                return {stdTTL: 1000};
            case FRAME_TYPES.M15:
                return {stdTTL: 1900};
            case FRAME_TYPES.M30:
                return {stdTTL: 3700};
            case FRAME_TYPES.H1:
                return {stdTTL: 14500};
            case FRAME_TYPES.H4:
                return {stdTTL: 86500};
            case FRAME_TYPES.D1:
                return {stdTTL: 172900};
            default:
                return {};
        }
    }
}

module.exports = new MemoryCache();
