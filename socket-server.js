const timeframeEventEmitter = require('./timeframe.event-emitter');
const tickerEventEmitter = require('./ticker.event-emitter');
const Utils = require('./utils');
const connectionResolver = require('./connection');
const BaseRepository = require('./repository');
const repository = new BaseRepository(connectionResolver);
const _ = require('lodash');
const CONSTANTS = require('./constants');

const timeframeSubscribers = new Map();

module.exports = (io) => {
    io.on('connection', onNewWebsocketConnection);

    setInterval(() => {
        io.emit("online", timeframeSubscribers.size);
    }, 1000);

    timeframeEventEmitter.subscribeOnUpdate((data) => {
        for (let [key, value] of timeframeSubscribers) {
            const updateItem = _.find(data, {symbol: value.symbol, frameType: value.frameType});
            if (updateItem) {
                console.log('io.to', key, JSON.stringify(updateItem));
                io.to(`${key}`).emit('appendTimeframe', updateItem);
            }
        }
    });

    tickerEventEmitter.subscribeOnUpdate((data) => {
        io.emit('tickers', data);
    });
};

function onNewWebsocketConnection(socket) {
    console.info(`Socket ${socket.id} has been connected.`);

    socket.on("disconnect", () => {
        timeframeSubscribers.delete(socket.id);
        console.info(`Socket ${socket.id} has been disconnected.`);
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
            console.log('subscriber', socket.id, JSON.stringify(subscriber));
            const collection = await repository.getCollection(subscriber.symbol, subscriber.frameType);
            const symbolList = await repository.getAll(collection, {
                query: {
                    frame: {
                        $gte: subscriber.from,
                        $lte: subscriber.to
                    }
                },
                sort: {
                    property: 'frame',
                    direction: 1
                }
            });
            socket.emit('initialTimeframes', symbolList.results.map((model) => {
                return Utils.convertModel(model, subscriber.symbol, subscriber.frameType);
            }));
        });
    });
}