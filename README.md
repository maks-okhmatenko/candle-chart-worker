# Candle chart worker

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```
Node.js LTS
MongoDB
```

### Installing
```
npm ci
```

Copy `.env.example` to `.env` and edit credentials in environment variables

```
cp .env.example .env
```

### Running
```
npm start
```

### Environment variables
- **NODE_ENV** - Node.js environment mode
- **MONGO_DB_URI** - mongodb connection url
- **MONGO_DB_NAME** - mongodb database name
- **SERVICE_MODE** - service mode
- **WS_STREAM_URI** - external websocket url
- **TICKER_LIST** - all possible tickers separated by comma symbol
- **TICKER_PER_SECOND** - how often the service will notify about new ticker values
- **TIMEFRAME_PER_MINUTE** - how often the service will notify about new timeframe values

#### Possible values and examples
- **NODE_ENV** - `development` or `production`
- **SERVICE_MODE** - `full` (listening to the WS, notifying and saving data to the database) or `readonly` (only listening and notifying)
- **TICKER_LIST** - `AUDCAD,AUDCHF,AUDJPY` and so on
- **TICKER_PER_SECOND** - `1`,`2`,`3`,`4`,`5`
- **TIMEFRAME_PER_MINUTE** - `1`,`2`,`3`,`4`

### Socket events

#### Client to server
- **getGlobalConfig**
- **subscribeTimeframe**
- **subscribeTickers**

#### Server to client
- **connect**
- **disconnect**
- **onGlobalConfig**
- **onInitialTimeframes**
- **onAppendTimeframe**
- **onInitialTickers**
- **onUpdateTickers**
