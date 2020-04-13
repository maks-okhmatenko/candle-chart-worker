const _ = require('lodash');
const moment = require('moment');
const {FRAME_TYPES} = require('../constants');

class TimeUtils {
    static getNewTickerFrameInMilliseconds() {
        const newFrame = moment.utc();
        let tickerPerSecond = _.toSafeInteger(process.env.TICKER_PER_SECOND);
        if (tickerPerSecond <= 0) {
            tickerPerSecond = 1;
        } else if (tickerPerSecond > 5) {
            tickerPerSecond = 5;
        }
        const timeRange = TimeUtils.createTimeRange(tickerPerSecond, 1000);
        const milliseconds = TimeUtils.calculateValueFromRange(timeRange, _.toSafeInteger(newFrame.format('SSS')));
        return newFrame.milliseconds(milliseconds).valueOf();
    }

    static getNewTimeframeInSeconds() {
        const newFrame = moment.utc();
        let timeframePerMinute = _.toSafeInteger(process.env.SAVE_TIMEFRAME_PER_MINUTE);
        if (timeframePerMinute <= 0) {
            timeframePerMinute = 1;
        } else if (timeframePerMinute > 4) {
            timeframePerMinute = 4;
        }
        const timeRange = TimeUtils.createTimeRange(timeframePerMinute, 60);
        const seconds = TimeUtils.calculateValueFromRange(timeRange, _.toSafeInteger(newFrame.format('s')));
        return newFrame.seconds(seconds).unix();
    }

    static createTimeRange(count, maxValue) {
        return _.map(_.range(0, maxValue, maxValue / count), item => _.toSafeInteger(item));
    }

    static calculateValueFromRange(range, value) {
        for (let i = range.length - 1; i >= 0; i--) {
            if (value >= range[i]) {
                return range[i];
            }
        }
        return range[0];
    }

    static getM1TimeframeCalculatedItem(messageItem, timeframeCacheItem) {
        if (!timeframeCacheItem) {
            const bid = _.replace(messageItem.Bid, ',', '.');
            return {open: bid, high: bid, low: bid, close: bid};
        }
        const prevHigh = _.toNumber(timeframeCacheItem.high);
        const prevLow = _.toNumber(timeframeCacheItem.low);
        const bid = _.toNumber(messageItem.Bid);
        if (bid > prevHigh) {
            timeframeCacheItem.high = messageItem.Bid;
        } else if (bid < prevLow) {
            timeframeCacheItem.low = messageItem.Bid;
        }
        timeframeCacheItem.close = messageItem.Bid;
        return timeframeCacheItem;
    }

    static getTimeframePeriod(frameType, frame) {
        switch (frameType) {
            case FRAME_TYPES.M1:
                return this.getM1TimeframePeriod(frame);
            case FRAME_TYPES.M5:
                return this.getM5TimeframePeriod(frame);
            case FRAME_TYPES.M15:
                return this.getM15TimeframePeriod(frame);
            case FRAME_TYPES.M30:
                return this.getM30TimeframePeriod(frame);
            case FRAME_TYPES.H1:
                return this.getH1TimeframePeriod(frame);
            case FRAME_TYPES.H4:
                return this.getH4TimeframePeriod(frame);
            case FRAME_TYPES.D1:
                return this.getD1TimeframePeriod(frame);
        }
    }

    static getM1TimeframePeriod(frame) {
        return {start: frame, end: frame}
    }

    static getM5TimeframePeriod(frame) {
        const momentFrame = moment.utc(frame * 1000);
        const mm = _.toString(momentFrame.format('mm'));
        const mm0 = _.toSafeInteger(mm[0]);
        const mm1 = _.toSafeInteger(mm[1]);
        let minutes = 0;
        if (mm1 >= 5) {
            minutes = 5;
        }
        const start = momentFrame.minutes(_.toSafeInteger(`${mm0}${minutes}`)).unix();
        const end = moment.utc(start * 1000).add(5, 'minutes').unix();
        return {start, end}
    }

    static getM15TimeframePeriod(frame) {
        const momentFrame = moment.utc(frame * 1000);
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
        const start = momentFrame.minutes(minutes).unix();
        const end = moment.utc(start * 1000).add(15, 'minutes').unix();
        return {start, end}
    }

    static getM30TimeframePeriod(frame) {
        const momentFrame = moment.utc(frame * 1000);
        const mm = _.toSafeInteger(momentFrame.format('mm'));
        let minutes;
        if (mm >= 0 && mm < 30) {
            minutes = 0;
        } else {
            minutes = 30;
        }
        const start = momentFrame.minutes(minutes).unix();
        const end = moment.utc(start * 1000).add(30, 'minutes').unix();
        return {start, end}
    }

    static getH1TimeframePeriod(frame) {
        const momentFrame = moment.utc(frame * 1000);
        const start = momentFrame.minutes(0).unix();
        const end = moment.utc(start * 1000).add(1, 'hour').unix();
        return {start, end}
    }

    static getH4TimeframePeriod(frame) {
        const momentFrame = moment.utc(frame * 1000);
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
        const start = momentFrame.hours(hours).minutes(0).unix();
        const end = moment.utc(start * 1000).add(4, 'hours').unix();
        return {start, end}
    }

    static getD1TimeframePeriod(frame) {
        const momentFrame = moment.utc(frame * 1000);
        const start = momentFrame.hours(0).minutes(0).unix();
        const end = moment.utc(start * 1000).add(1, 'day').unix();
        return {start, end}
    }

    static calculateSymbol(symbolList) {
        const startRecord = {open: '0', high: '0', low: '0', close: '0'};
        if (symbolList && symbolList.length) {
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
            return record;
        }
        return startRecord;
    }

    static getCacheCountByFrameType(frameType) {
        switch (frameType) {
            case FRAME_TYPES.M1:
                return 6;
            case FRAME_TYPES.M5:
                return 4;
            case FRAME_TYPES.M15:
                return 4;
            case FRAME_TYPES.M30:
                return 3;
            case FRAME_TYPES.H1:
                return 5;
            case FRAME_TYPES.H4:
                return 7;
            case FRAME_TYPES.D1:
                return 2;
            default:
                return 0;
        }
    }
}

module.exports = TimeUtils;
