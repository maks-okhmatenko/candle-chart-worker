const WebSocket = require('ws');
const _ = require('lodash');
const moment = require('moment');
const timeframeEventEmitter = require('./timeframe.event-emitter');
const tickerEventEmitter = require('./ticker.event-emitter');
const CONSTANTS = require('./constants');
const Utils = require('./utils');

module.exports = () => {
    const ws = new WebSocket(_.toString(process.env.WS_STREAM_URI));
    const ticketListENV = Utils.getTickerList();
    let timeframesList = {};
    let timeframeMinutes;
    let timeframeSeconds;
    let timeframeMilliseconds;

    let tickers = {};
    let tickerFrameMilliseconds;
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
        const newFrameMilliseconds = Utils.getNewTickerFrameInMilliseconds();
        const newFrameSeconds = Utils.getNewTimeframeInSeconds();
        if (tickerFrameMilliseconds !== newFrameMilliseconds) {
            tickerEventEmitter.notifyTickers(_.extend({}, tickers));
            tickerFrameMilliseconds = newFrameMilliseconds;
        }
        if (tickerFrameSeconds !== newFrameSeconds) {
            tickerEventEmitter.saveTickers(_.extend({}, tickers));
            tickerFrameSeconds = newFrameSeconds;
        }
        _.each(messageList, (messageItem) => {
            if (ticketListENV.length && !_.includes(ticketListENV, messageItem.Symbol)) {
                return;
            }
            _.set(tickers, [messageItem.Symbol], _.extend({}, messageItem, {Time: newFrameMilliseconds}));
        });
    }

    function calculateTimeframes(messageList) {
        const newFrameMinutes = moment.utc().startOf('minute').unix();
        const newFrameMilliseconds = Utils.getNewTickerFrameInMilliseconds();
        const newFrameSeconds = Utils.getNewTimeframeInSeconds();
        if (timeframeMilliseconds !== newFrameMilliseconds) {
            timeframeEventEmitter.notifyTimeframes(_.extend({}, timeframesList), timeframeMinutes, CONSTANTS.FRAME_TYPES.M1);
            timeframeMilliseconds = newFrameMilliseconds;
        }
        if (timeframeSeconds !== newFrameSeconds) {
            timeframeEventEmitter.saveAllTimeframes(_.extend({}, timeframesList), timeframeMinutes);
            timeframeSeconds = newFrameSeconds;
        }
        if (timeframeMinutes !== newFrameMinutes) {
            timeframesList = {};
            timeframeMinutes = newFrameMinutes;
        }
        _.each(messageList, (messageItem) => {
            if (ticketListENV.length && !_.includes(ticketListENV, messageItem.Symbol)) {
                return;
            }
            const timeframeItem = _.get(timeframesList, [messageItem.Symbol]);
            if (!timeframeItem) {
                const bid = _.replace(messageItem.Bid, ',', '.');
                _.set(timeframesList, [messageItem.Symbol], {open: bid, high: bid, low: bid, close: bid});
                return;
            }
            const prevHigh = _.toNumber(timeframeItem.high);
            const prevLow = _.toNumber(timeframeItem.low);
            const bid = _.toNumber(messageItem.Bid);
            if (bid > prevHigh) {
                _.set(timeframesList, [messageItem.Symbol, 'high'], messageItem.Bid);
            } else if (bid < prevLow) {
                _.set(timeframesList, [messageItem.Symbol, 'low'], messageItem.Bid);
            }
            _.set(timeframesList, [messageItem.Symbol, 'close'], messageItem.Bid);
        });
    }
};
