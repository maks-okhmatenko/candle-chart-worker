const _ = require('lodash');
const moment = require('moment');
const connectionResolver = require('./connection');
const Utils = require('./utils');

class Repository {
    constructor(resolver) {
        this.resolver = resolver;
    }

    createIndex(collection, fieldOrSpec) {
        return new Promise((resolve, reject) => {
            collection.createIndex(fieldOrSpec, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    }

    async getTimeframeCollection(symbol, frameType) {
        const db = await this.resolver.getConnection();
        const collection = db.collection(`${symbol}_${frameType}`);
        await this.createIndex(collection, {frame: -1});
        return collection;
    }

    async getTickerCollection() {
        const db = await this.resolver.getConnection();
        return db.collection('tickers');
    }

    async upsertTimeframe(collection, record) {
        if (!Utils.isReadonlyMode()) {
            const result = await collection.updateOne({frame: record.frame}, {
                $set: _.extend({}, record, {updated_at: moment.utc().unix()}),
            }, {upsert: true});
            return _.first(result.ops);
        }
    }

    async upsertTicker(collection, record) {
        if (!Utils.isReadonlyMode()) {
            const result = await collection.updateOne({Symbol: record.Symbol}, {
                $set: _.extend({}, record, {updated_at: moment.utc().unix()}),
            }, {upsert: true});
            return _.first(result.ops);
        }
    }

    async getAll(collection, {query = {}, sort = {}, skip = 0, limit, project = {}} = {}) {
        let cursor = _.isEmpty(sort) ?
            collection.find(query).project(project).skip(skip) :
            collection.find(query).project(project).sort(sort.property, sort.direction).skip(skip);

        if (limit) {
            cursor = cursor.limit(limit);
        }

        const total = await cursor.count();
        const results = await cursor.toArray();

        return {total, results};
    }

    async getTimeframesByRange(symbol, frameType, from, to) {
        const collection = await this.getTimeframeCollection(symbol, frameType);
        const list = await this.getAll(collection, {
            query: {
                frame: {
                    $gte: from,
                    $lte: to
                }
            },
            sort: {
                property: 'frame',
                direction: 1
            }
        });
        return list.results.map(model => Utils.convertTimeframeModel(model, symbol, frameType))
    }

    async getTimeframesByCount(symbol, frameType, from, count) {
        const collection = await this.getTimeframeCollection(symbol, frameType);
        const list = await this.getAll(collection, {
            query: {
                frame: {
                    $gte: from
                }
            },
            sort: {
                property: 'frame',
                direction: 1
            },
            limit: count
        });
        return list.results.map(model => Utils.convertTimeframeModel(model, symbol, frameType))
    }

}

module.exports = new Repository(connectionResolver);
