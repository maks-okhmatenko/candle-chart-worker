const WebSocket = require('ws');
const _ = require('lodash');
const moment = require('moment');
const timeframeEventEmitter = require('./timeframe.event-emitter');

module.exports = () => {
    const ws = new WebSocket(_.toString(process.env.WS_STREAM_URI));
    let timeframes = {};
    let frame;

    ws.on('open', function open() {
        console.log('ws open');
    });

    ws.on('message', async function incoming(data) {
        console.log('on message ---------------->>');
        const newFrame = moment().utc().startOf('minute').unix();
        const messageList = JSON.parse(data);
        if (!_.isArray(messageList)) {
            return;
        }
        if (frame !== newFrame) {
            // todo: save here
            timeframeEventEmitter.saveTimeframes(_.extend({}, timeframes), frame);
            timeframeEventEmitter.notifyTimeframes(_.extend({}, timeframes), frame);
            frame = newFrame;
            timeframes = {};
        }
        _.each(messageList, (messageItem) => {
            const timeframeItem = _.get(timeframes, [messageItem.Symbol]);
            if (!timeframeItem) {
                const bid = _.replace(messageItem.Bid, ',', '.');
                _.set(timeframes, [messageItem.Symbol], {
                    open: bid,
                    high: bid,
                    low: bid,
                    close: bid
                });
                return;
            }
            const prevHigh = _.toNumber(timeframeItem.high);
            const prevLow = _.toNumber(timeframeItem.low);
            const bid = _.toNumber(messageItem.Bid);
            if (bid > prevHigh) {
                _.set(timeframes, [messageItem.Symbol, 'high'], messageItem.Bid);
            } else if (bid < prevLow) {
                _.set(timeframes, [messageItem.Symbol, 'low'], messageItem.Bid);
            }
            _.set(timeframes, [messageItem.Symbol, 'close'], messageItem.Bid);
        });
    });
};
