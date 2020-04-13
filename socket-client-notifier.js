const WebSocket = require('ws');
const _ = require('lodash');
const moment = require('moment');
const timeframeEventEmitter = require('./timeframe.event-emitter');
const tickerEventEmitter = require('./ticker.event-emitter');
const CONSTANTS = require('./constants');
const Utils = require('./modules/utils');
const TimeUtils = require('./modules/time-utils');
const memoryCache = require('./memory-cache');
const repository = require('./repository');

module.exports = () => {
    setImmediate(async () => {
        await initializeData();

        const ws = new WebSocket(_.toString(process.env.WS_STREAM_URI));
        let timeframeMinutes;
        let timeframeMilliseconds;

        let tickers = {};
        let tickerFrameMilliseconds;

        ws.on('open', function open() {
            console.log('ws open');
        });

        ws.on('message', incoming);

        function incoming(data) {
            try {
                const messageList = JSON.parse(data);
                try {
                    if (!_.isArray(messageList)) {
                        return;
                    }
                    // calculateTickers(messageList);
                    calculateTimeframes(messageList);
                } catch (e) {
                    console.log(e);
                }
            } catch (e) {
                console.log('invalid message', data);
            }
        }

        function calculateTickers(messageList) {
            const newFrameMilliseconds = TimeUtils.getNewTickerFrameInMilliseconds();
            if (tickerFrameMilliseconds !== newFrameMilliseconds) {
                tickerEventEmitter.notifyTickers(_.extend({}, tickers));
                tickerFrameMilliseconds = newFrameMilliseconds;
            }
            _.each(messageList, (messageItem) => {
                if (Utils.shouldSkipTickerList(messageItem.Symbol)) {
                    return;
                }
                _.set(tickers, [messageItem.Symbol], _.extend({}, messageItem, {Time: newFrameMilliseconds}));
            });
        }

        function calculateTimeframes(messageList) {
            const timeframeMinutes = moment.utc().startOf('minute').unix();
            const newFrameMilliseconds = TimeUtils.getNewTickerFrameInMilliseconds();
            if (timeframeMilliseconds !== newFrameMilliseconds) {
                _.each(_.keys(CONSTANTS.FRAME_TYPES), (frameType) => {
                    const {timestamp, result} = memoryCache.getAllSymbols(CONSTANTS.FRAME_TYPES[frameType], timeframeMinutes);
                    if (result) {
                        timeframeEventEmitter.notifyTimeframes(_.extend({}, result), timestamp, CONSTANTS.FRAME_TYPES[frameType]);
                    }
                });
                timeframeMilliseconds = newFrameMilliseconds;
            }
            _.each(messageList, (messageItem) => {
                if (Utils.shouldSkipTickerList(messageItem.Symbol)) {
                    return;
                }
                const timeframeCacheItem = memoryCache.get(CONSTANTS.FRAME_TYPES.M1, messageItem.Symbol, timeframeMinutes);
                const newTimeframeCacheItem = TimeUtils.getM1TimeframeCalculatedItem(messageItem, timeframeCacheItem);
                memoryCache.saveAllSymbols(messageItem.Symbol, timeframeMinutes, newTimeframeCacheItem)
            });
        }

        async function initializeData() {
            const timeframeMinutes = moment.utc().startOf('minute').unix();
            const tickerList = Utils.getTickerList();
            if (!tickerList && !tickerList.length) {
                return;
            }
            const frameTypes = _.keys(CONSTANTS.FRAME_TYPES);
            for (let i = 0; i < tickerList.length; i++) {
                const symbol = tickerList[i];
                for (let j = 0; j < frameTypes.length; j++) {
                    const frameType = CONSTANTS.FRAME_TYPES[frameTypes[j]];
                    const {end} = TimeUtils.getTimeframePeriod(frameType, timeframeMinutes);
                    const list = await repository.getTimeframeByCount(symbol, frameType, end, TimeUtils.getCacheCountByFrameType(frameType));
                    if (list && list.results && list.results.length) {
                        _.each(list.results, (model) => {
                            memoryCache.set(frameType, symbol, model.frame, {
                                open: model.open,
                                high: model.high,
                                low: model.low,
                                close: model.close
                            });
                        })
                    }
                }
            }
        }
    });
};

