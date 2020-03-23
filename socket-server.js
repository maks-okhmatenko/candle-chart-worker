const timeframeEventEmitter = require('./timeframe.event-emitter');
const Utils = require('./utils');
const connectionResolver = require('./connection');
const BaseRepository = require('./repositories/base.repository');
const repository = new BaseRepository(connectionResolver);
const _ = require('lodash');
const CONSTANTS = require('./constants');

const subscribers = new Map();

module.exports = (io) => {
    io.on('connection', onNewWebsocketConnection);

    setInterval(() => {
        io.emit("online", subscribers.size);
    }, 1000);

    timeframeEventEmitter.subscribeOnUpdate((data) => {
        for (let [key, value] of subscribers) {
            const updateItem = _.find(data, {symbol: value.symbol, frameType: value.frameType});
            if (updateItem) {
                console.log('io.to', key, JSON.stringify(updateItem));
                io.to(`${key}`).emit('append', updateItem);
            }
        }
    });
};

function onNewWebsocketConnection(socket) {
    console.info(`Socket ${socket.id} has been connected.`);

    socket.on("disconnect", () => {
        subscribers.delete(socket.id);
        console.info(`Socket ${socket.id} has been disconnected.`);
    });

    socket.on('subscribe', (data) => {
        if (!CONSTANTS.FRAME_TYPES[data.frameType]) {
            return;
        }
        const subscriber = {
            symbol: data.symbol,
            frameType: data.frameType,
            from: data.from,
            to: data.to
        };
        subscribers.set(socket.id, subscriber);
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
            socket.emit('initial', symbolList.results.map((model) => {
                return Utils.convertModel(model, subscriber.symbol, subscriber.frameType);
            }));
        });
    });
}