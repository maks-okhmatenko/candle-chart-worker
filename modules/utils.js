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

    static convertTimeframeModel(model, symbol, frameType) {
        return {
            frameType,
            symbol,
            x: model.frame,
            y: [model.open, model.high, model.low, model.close]
        }
    }

    static convertTickerModel(model) {
        const convertedModel = _.extend({}, model);
        delete convertedModel._id;
        delete convertedModel.updated_at;
        return convertedModel;
    }

    static convertTickers(tickers) {
        return _.map(_.keys(tickers), (symbol) => tickers[symbol]);
    }

    static getTickerList() {
        const TICKER_LIST = _.toString(process.env.TICKER_LIST);
        if (!TICKER_LIST) {
            return [];
        }
        return _.map(_.split(_.toString(TICKER_LIST), ','), _.trim);
    }

    static getReadableDateNow() {
        return moment.utc().format('DD.MM.YYYY HH:mm:ss');
    }

    static getTimeframesTimerLabel(frameType) {
        return `save timeframes - ${frameType} - ${Utils.getReadableDateNow()}`;
    }

    static getTickersTimerLabel() {
        return `save tickers - ${Utils.getReadableDateNow()}`;
    }

    static isReadonlyMode() {
        return _.toString(process.env.SERVICE_MODE) === 'readonly';
    }

    static shouldSkipTickerList(symbol) {
        const tickerListENV = Utils.getTickerList();
        return !tickerListENV.length || (tickerListENV.length && !_.includes(tickerListENV, symbol));
    }
}

module.exports = Utils;
