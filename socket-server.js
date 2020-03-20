const timeframeEventEmitter = require('./timeframe.event-emitter');
const Utils = require('./utils');
const connectionResolver = require('./connection');
const BaseRepository = require('./repositories/base.repository');
const repository = new BaseRepository(connectionResolver);

const subscribers = new Map();

module.exports = (io) => {
    io.on('connection', onNewWebsocketConnection);

    setInterval(() => {
        io.emit("online", subscribers.size);
    }, 1000);

    timeframeEventEmitter.subscribeOnUpdate((data) => {
        console.log('onUpdate', data);
        console.log('subscribers', subscribers);

        // io.to(`${socketId}`).emit('hey', 'I just met you');

    });
};

function onNewWebsocketConnection(socket) {
    console.info(`Socket ${socket.id} has been connected.`);

    socket.on("disconnect", () => {
        subscribers.delete(socket.id);
        console.info(`Socket ${socket.id} has been disconnected.`);
    });

    socket.on('subscribe', (data) => {
        const subscriber = {
            symbol: data.symbol,
            frameType: data.frameType
        };
        subscribers.set(socket.id, subscriber);
        setImmediate(async () => {
            console.log(subscriber);
            const collection = await repository.getCollection(subscriber.symbol, subscriber.frameType);
            const symbolList = await repository.getAll(collection, {sort: {property: 'frame', direction: 1}});
            socket.emit('initial', symbolList.results.map((model) => {
                return Utils.convertModel(model, subscriber.symbol);
            }));
        });
    });
}