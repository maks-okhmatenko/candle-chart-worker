const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');

class ConnectionResolver {
    constructor() {
        this.uri = _.toString(process.env.MONGO_DB_URI);
        this.dbName = _.toString(process.env.MONGO_DB_NAME);
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        function cleanup() {
            console.log('cleanup');
            if (this.client) {
                this.client.close();
            }
            process.exit();
        }
    }

    async getConnection() {
        if (!this.db) {
            if (!this.uri) {
                throw Error('No valid DB server URI was provided');
            }
            try {
                console.time('mongodb connect');
                this.client = await MongoClient.connect(this.uri, {useNewUrlParser: true, useUnifiedTopology: true});
                console.timeEnd('mongodb connect');
                this.db = this.client.db(this.dbName);
            } catch (e) {
                console.log(e);
                if (this.client) {
                    await this.client.close();
                    delete this.db;
                }
                return await this.getConnection();
            }
        }

        return this.db;
    }
}

const mongoDBResolver = new ConnectionResolver();

module.exports = mongoDBResolver;
