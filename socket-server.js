const timeframeEventEmitter = require('./timeframe.event-emitter');
const tickerEventEmitter = require('./ticker.event-emitter');
const Utils = require('./utils');
const repository = require('./repository');
const _ = require('lodash');
const CONSTANTS = require('./constants');

const timeframeSubscribers = new Map();
const tickerSubscribers = new Set();

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
        for (const subscriberId of tickerSubscribers) {
            console.log('io.to ticker', subscriberId, JSON.stringify(data));
            io.to(`${subscriberId}`).emit('onUpdateTickers', data);
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
        console.info(`Socket ${socket.id} has been disconnected.`);
    });

    socket.on('subscribeTickers', () => {
        tickerSubscribers.add(socket.id);
        setImmediate(async () => {
            console.log('ticker subscriber', socket.id);
            const collection = await repository.getTickerCollection();
            const tickerList = await repository.getAll(collection);
            socket.emit('onInitialTickers', tickerList.results.map(Utils.convertTickerModel));
        });
    });

    socket.on('subscribeTimeframe', (data) => {
        if (!CONSTANTS.FRAME_TYPES[data.frameType]) {
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
            const list = await repository.getTimeframesByRange(subscriber.symbol, subscriber.frameType, subscriber.from, subscriber.to);
            socket.emit('onInitialTimeframes', list);
        });
    });

    socket.on('getTimeframeByRange', (data) => {
        if (!CONSTANTS.FRAME_TYPES[data.frameType]) {
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
            const list = await repository.getTimeframesByRange(requestData.symbol, requestData.frameType, requestData.from, requestData.to);
            socket.emit('onTimeframeByRange', list);
        });
    });
}