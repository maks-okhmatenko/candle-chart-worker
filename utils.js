const _ = require('lodash');

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

    static convertModel(model, symbol, frameType){
        return {
            frameType,
            symbol,
            x: model.frame,
            y: [model.open, model.high, model.low, model.close]
        }
    }

    static convertTickers(tickers){
        return _.map(_.keys(tickers), (symbol) => tickers[symbol]);
    }

    static getTickerList(){
        return _.map(_.split(_.toString(process.env.TICKER_LIST), ','), _.trim);
    }
}

module.exports = Utils;