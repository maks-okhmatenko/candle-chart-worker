const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

class ConnectionResolver {
    constructor() {
        this.uri = _.toString(process.env.MONGO_DB_URI);
        this.dbName = _.toString(process.env.MONGO_DB_NAME);
    }

    async getConnection() {
        if (!this.db) {
            if (!this.uri) {
                throw Error('No valid DB server URI was provided');
            }
            try {
                this.client = await MongoClient.connect(this.uri, {useNewUrlParser: true, useUnifiedTopology: true});
                this.db = this.client.db(this.dbName);
            } catch (e) {
                console.error(e);
            }
        }

        return this.db;
    }
}

const mongoDBResolver = new ConnectionResolver();

module.exports = mongoDBResolver;