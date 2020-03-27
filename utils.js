const _ = require('lodash');
const moment = require('moment');

class Utils {
    static convertTimeframes(timeframes, frame, frameType) {
        const result = [];
        _.each(_.keys(timeframes), (symbol) => {
            const timeframe = _.get(timeframes, [symbol]);
            if (timeframe) {
                result.push({
                    frameType,
                    symbol,
                    x: frame,
                    y: [timeframe.open, timeframe.high, timeframe.low, timeframe.close]
                })
            }
        });
        return result;
    }

    static convertModel(model, symbol, frameType) {
        return {
            frameType,
            symbol,
            x: model.frame,
            y: [model.open, model.high, model.low, model.close]
        }
    }

    static convertTickers(tickers) {
        return _.map(_.keys(tickers), (symbol) => tickers[symbol]);
    }

    static getTickerList() {
        const TICKER_LIST = _.toString(process.env.TICKER_LIST);
        if(!TICKER_LIST){
            return [];
        }
        return _.map(_.split(_.toString(TICKER_LIST), ','), _.trim);
    }

    static getReadableDateNow() {
        return moment.utc().format('DD.MM.YYYY HH:mm:ss');
    }

    static getTimerLabel(frameType) {
        return `save timeframes - ${frameType} - ${Utils.getReadableDateNow()}`;
    }

    static isReadonlyMode() {
        return _.toString(process.env.SERVICE_MODE) === 'readonly';
    }

    static getNewTickerFrameInMilliseconds() {
        const newFrame = moment.utc();
        let tickerPerSecond = _.toSafeInteger(process.env.TICKER_PER_SECOND);
        if (tickerPerSecond <= 0) {
            tickerPerSecond = 1;
        } else if (tickerPerSecond > 5) {
            tickerPerSecond = 5;
        }
        const timeRange = Utils.createTimeRange(tickerPerSecond, 1000);
        const milliseconds = Utils.calculateValueFromRange(timeRange, _.toSafeInteger(newFrame.format('SSS')));
        return newFrame.milliseconds(milliseconds).valueOf();
    }

    static getNewTimeframeInSeconds() {
        const newFrame = moment.utc();
        let timeframePerMinute = _.toSafeInteger(process.env.TIMEFRAME_PER_MINUTE);
        if (timeframePerMinute <= 0) {
            timeframePerMinute = 1;
        } else if (timeframePerMinute > 4) {
            timeframePerMinute = 4;
        }
        const timeRange = Utils.createTimeRange(timeframePerMinute, 60);
        const seconds = Utils.calculateValueFromRange(timeRange, _.toSafeInteger(newFrame.format('s')));
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
}

module.exports = Utils;