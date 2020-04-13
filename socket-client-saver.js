const WebSocket = require('ws');
const _ = require('lodash');
const moment = require('moment');
const timeframeEventEmitter = require('./timeframe.event-emitter');
const tickerEventEmitter = require('./ticker.event-emitter');
const Utils = require('./modules/utils');
const TimeUtils = require('./modules/time-utils');

module.exports = () => {
    const ws = new WebSocket(_.toString(process.env.WS_STREAM_URI));
    let timeframesList = {};
    let timeframeMinutes;
    let timeframeSeconds;

    let tickers = {};
    let tickerFrameSeconds;

    ws.on('open', function open() {
        console.log('ws open');
    });

    ws.on('message', incoming);

    function incoming(data) {
        try {
            const messageList = JSON.parse(data);
            if (!_.isArray(messageList)) {
                return;
            }
            calculateTickers(messageList);
            calculateTimeframes(messageList);
        } catch (e) {
            console.log('invalid message', data);
        }
    }

    function calculateTickers(messageList) {
        const newFrameMilliseconds = TimeUtils.getNewTickerFrameInMilliseconds();
        const newFrameSeconds = TimeUtils.getNewTimeframeInSeconds();
        if (tickerFrameSeconds !== newFrameSeconds) {
            tickerEventEmitter.saveTickers(_.extend({}, tickers));
            tickerFrameSeconds = newFrameSeconds;
        }
        _.each(messageList, (messageItem) => {
            if (Utils.shouldSkipTickerList(messageItem.Symbol)) {
                return;
            }
            _.set(tickers, [messageItem.Symbol], _.extend({}, messageItem, {Time: newFrameMilliseconds}));
        });
    }

    function calculateTimeframes(messageList) {
        const newFrameMinutes = moment.utc().startOf('minute').unix();
        const newFrameSeconds = TimeUtils.getNewTimeframeInSeconds();
        if (timeframeSeconds !== newFrameSeconds) {
            timeframeEventEmitter.saveAllTimeframes(_.extend({}, timeframesList), timeframeMinutes);
            timeframeSeconds = newFrameSeconds;
        }
        if (timeframeMinutes !== newFrameMinutes) {
            timeframesList = {};
            timeframeMinutes = newFrameMinutes;
        }
        _.each(messageList, (messageItem) => {
            if (Utils.shouldSkipTickerList(messageItem.Symbol)) {
                return;
            }
            const timeframeItem = _.get(timeframesList, [messageItem.Symbol]);
            const newTimeframeItem = TimeUtils.getM1TimeframeCalculatedItem(messageItem, timeframeItem);
            _.set(timeframesList, messageItem.Symbol, newTimeframeItem);
        });
    }
};
