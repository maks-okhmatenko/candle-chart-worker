const timeframeEventEmitter = require('./timeframe.event-emitter');
const tickerEventEmitter = require('./ticker.event-emitter');
const Utils = require('./modules/utils');
const repository = require('./repository');
const _ = require('lodash');
const CONSTANTS = require('./constants');

const timeframeSubscribers = new Map();
const tickerSubscribers = new Map();

module.exports = (io) => {
    io.on('connection', onNewWebsocketConnection);

    setInterval(() => {
        io.emit("online", timeframeSubscribers.size);
    }, 1000);

    timeframeEventEmitter.subscribeOnUpdate((data) => {
        for (let [key, value] of timeframeSubscribers) {
            const updateItem = _.find(data, {symbol: value.symbol, frameType: value.frameType});
            if (updateItem) {
                console.log('io.to timeframe', key, JSON.stringify(updateItem));
                io.to(`${key}`).emit('onAppendTimeframe', updateItem);
            }
        }
    });

    tickerEventEmitter.subscribeOnUpdate((data) => {
        if (!_.isArray(data)) {
            return;
        }
        for (let [key, value] of tickerSubscribers) {
            const tickers = _.filter(data, ticker => value.list.some(item => item === ticker.Symbol));
            if (tickers.length) {
                console.log('io.to ticker', key);
                io.to(`${key}`).emit('onUpdateTickers', tickers);
            }
        }
    });
};

function onNewWebsocketConnection(socket) {
    console.info(`Socket ${socket.id} has been connected.`);

    socket.on('getGlobalConfig', () => {
        socket.emit('onGlobalConfig', {
            CONSTANTS,
            TICKER_LIST: Utils.getTickerList()
        });
    });

    socket.on("disconnect", () => {
        timeframeSubscribers.delete(socket.id);
        tickerSubscribers.delete(socket.id);
        console.info(`Socket ${socket.id} has been disconnected.`);
    });

    socket.on('subscribeTickers', (data) => {
        if (!data || !_.isArray(data.list)) {
            return;
        }
        tickerSubscribers.set(socket.id, {list: data.list});
        setImmediate(async () => {
            console.log('ticker subscriber', socket.id, data.list);
            const envTickerList = Utils.getTickerList();
            const collection = await repository.getTickerCollection();
            const tickerList = await repository.getAll(collection, {
                query: {
                    Symbol: {$in: _.filter(envTickerList, symbol => data.list.some(item => item === symbol))}
                }
            });
            socket.emit('onInitialTickers', tickerList.results.map(Utils.convertTickerModel));
        });
    });

    socket.on('subscribeTimeframe', (data) => {
        if (!data || !CONSTANTS.FRAME_TYPES[data.frameType]) {
            return;
        }
        const subscriber = {
            symbol: data.symbol,
            frameType: data.frameType,
            from: data.from,
            to: data.to
        };
        timeframeSubscribers.set(socket.id, subscriber);
        setImmediate(async () => {
            console.log('timeframe subscriber', socket.id, JSON.stringify(subscriber));
            const list = await repository.getConvertedTimeframesByRange(subscriber.symbol, subscriber.frameType, subscriber.from, subscriber.to);
            socket.emit('onInitialTimeframes', list);
        });
    });

    socket.on('subscribeTimeframeInitByCount', (data) => {
        if (!data || !CONSTANTS.FRAME_TYPES[data.frameType]) {
            return;
        }
        const subscriber = {
            symbol: data.symbol,
            frameType: data.frameType,
            to: data.to,
            count: _.toSafeInteger(data.count),
        };
        timeframeSubscribers.set(socket.id, subscriber);
        setImmediate(async () => {
            console.log('timeframe subscriber, init by count', socket.id, JSON.stringify(subscriber));
            const list = await repository.getConvertedTimeframesByCount(subscriber.symbol, subscriber.frameType, subscriber.to, subscriber.count);
            socket.emit('onInitialTimeframes', list);
        });
    });

    socket.on('getTimeframeByRange', (data) => {
        if (!data || !CONSTANTS.FRAME_TYPES[data.frameType]) {
            return;
        }
        const requestData = {
            symbol: data.symbol,
            frameType: data.frameType,
            from: data.from,
            to: data.to
        };
        setImmediate(async () => {
            console.log('get timeframe by range', socket.id, JSON.stringify(requestData));
            const list = await repository.getConvertedTimeframesByRange(requestData.symbol, requestData.frameType, requestData.from, requestData.to);
            socket.emit('onTimeframeByRange', list);
        });
    });

    socket.on('getTimeframeByCount', (data) => {
        if (!data || !CONSTANTS.FRAME_TYPES[data.frameType]) {
            return;
        }
        const requestData = {
            symbol: data.symbol,
            frameType: data.frameType,
            to: data.to,
            count: _.toSafeInteger(data.count),
        };
        setImmediate(async () => {
            console.log('get timeframe by count', socket.id, JSON.stringify(requestData));
            const list = await repository.getConvertedTimeframesByCount(requestData.symbol, requestData.frameType, requestData.to, requestData.count);
            socket.emit('onTimeframeByCount', list);
        });
    });
}
