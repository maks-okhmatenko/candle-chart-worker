const _ = require('lodash');
const moment = require('moment');

class Repository {
    constructor(resolver) {
        this.resolver = resolver;
    }

    async getCollection(symbol, frameType) {
        const db = await this.resolver.getConnection();
        return db.collection(`${symbol}_${frameType}`);
    }

    async upsert(collection, record) {
        const result = await collection.updateOne({frame: record.frame}, {
            $set: _.extend({}, record, {updated_at: moment.utc().unix()}),
        }, {upsert: true});
        return _.first(result.ops);
    }

    async getAll(collection, {query = {}, sort = {}, skip = 0, limit = 10, project = {}}) {
        const cursor = _.isEmpty(sort) ?
            collection.find(query).project(project).skip(skip) :
            collection.find(query).project(project).sort(sort.property, sort.direction).skip(skip);

        const total = await cursor.count();
        const results = await cursor.toArray();

        return {total, results};
    }

}

module.exports = Repository;