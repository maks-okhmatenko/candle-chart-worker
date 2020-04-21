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
- **SAVE_TIMEFRAME_PER_MINUTE** - how often the service will save timeframes into the database

#### Possible values and examples
- **NODE_ENV** - `development` or `production`
- **SERVICE_MODE** - `full` (listening to the WS, notifying and saving data to the database) or `readonly` (only listening and notifying)
- **TICKER_LIST** - `AUDCAD,AUDCHF,AUDJPY` and so on
- **TICKER_PER_SECOND** - `1`,`2`,`3`,`4`,`5`
- **SAVE_TIMEFRAME_PER_MINUTE** - `1`,`2`,`3`,`4`

### Socket events

#### Client to server
- **getGlobalConfig** - getting configuration from the server
- **subscribeTimeframe** - subscription on the timeframe update, get initial data by range
- **getTimeframeByRange** - get timeframe from the database by range
```javascript
// request data for subscribeTimeframe and getTimeframesByRange events
const data = {
    symbol: globalConfig.TICKER_LIST[0], // ticker name from the TICKER_LIST
    frameType: globalConfig.CONSTANTS.FRAME_TYPES.M5, // frame type: M1, M5, M15, M30, H1, H4, D1
    from: 1585237432, // start of the timeframe, unix timestamp
    to: 1585338232 // end of the timeframe, unix timestamp
}
```
- **subscribeTimeframeInitByCount** - subscription on the timeframe update, get initial data by count
- **getTimeframeByCount** - get timeframe from the database by count
```javascript
// request data
const data = {
    symbol: globalConfig.TICKER_LIST[0], // ticker name from the TICKER_LIST
    frameType: globalConfig.CONSTANTS.FRAME_TYPES.M5, // frame type: M1, M5, M15, M30, H1, H4, D1
    to: 1585237432, // end of the timeframe, unix timestamp
    count: 10 // timeframe count
}
```
- **subscribeTickers** - subscription on tickers update
```javascript
// request data
const data = {
    list: ['EURAUD', 'EURCAD'] // ticker names from the TICKER_LIST
}
```

#### Server to client
- **connect** - native socket.io event
- **disconnect** - native socket.io event
- **onGlobalConfig** - an answer on **getGlobalConfig** event
```javascript
// response data
const data = {
    CONSTANTS: {
        FRAME_TYPES: {
            M1: 'M1',
            M5: 'M5',
            M15: 'M15',
            M30: 'M30',
            H1: 'H1',
            H4: 'H4',
            D1: 'D1'
        }
    },
    TICKER_LIST: ['AUDCAD', 'AUDCHF', 'AUDJPY'] // Ticker list from the environment variable TICKER_LIST
}
```
- **onInitialTimeframes** - an answer on **subscribeTimeframe** event, should be listened only once, it will send initial timeframe state
```javascript
// response data
const data = [{
    frameType: 'M5', // frame type
    symbol: 'EURAUD', // ticker symbol
    x: 1585251600, // unix timestamp
    y: ['1.81499', '1.81509', '1.81408', '1.81446'] // values: [open, high, low, close] 
}]
```
- **onAppendTimeframe** - an answer on **subscribeTimeframe** event, it will send timeframe updates
```javascript
// response data
const data = {
    frameType: 'M5', // frame type
    symbol: 'EURAUD', // ticker symbol
    x: 1585251600, // unix timestamp
    y: ['1.81499', '1.81509', '1.81408', '1.81446'] // values: [open, high, low, close] 
}
```
- **onTimeframeByRange** - an answer on **getTimeframeByRange** event
- **onTimeframeByCount** - an answer on **getTimeframeByCount** event
```javascript
// response data for onTimeframeByRange and onTimeframeByCount events
const data = [{
    frameType: 'M5', // frame type
    symbol: 'EURAUD', // ticker symbol
    x: 1585251600, // unix timestamp
    y: ['1.81499', '1.81509', '1.81408', '1.81446'] // values: [open, high, low, close] 
}]
```
- **onInitialTickers** - an answer on **subscribeTickers** event, should be listened only once, it will send initial tickers state
- **onUpdateTickers** - an answer on **subscribeTickers** event, it will send tickers update
```javascript
// response data for onInitialTickers and onUpdateTickers events
const data = [{
    Symbol: 'EURAUD',
    Ask: '1,80619',
    Bid: '1,80503',
    Digits: '5',
    Direction: '0',
    Spread: '0',
    Time: 1585475414666
},{
    Symbol: 'EURCHF',
    Ask: '1,06012',
    Bid: '1,05912',
    Digits: '5',
    Direction: '0',
    Spread: '0',
    Time: 1585475414666
}]
```
