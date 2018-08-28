# oebb

Client for the [Austrian Federal Railways (ÖBB)](https://oebb.at/) API client. Inofficial, please ask ÖBB for permission before using this module in production. **Actually, there should be no need for projects like this since endpoints for state-owned public transportation operators should be open to the public. It's ~~2017~~ 2018. By the way: Even [Deutsche Bahn](http://www.bahn.de/) gets this now, and you don't ever want to be less progressive than them, because that would hurt their pride 😄.**

*Still in progress*

[![npm version](https://img.shields.io/npm/v/oebb.svg)](https://www.npmjs.com/package/oebb)
[![Build Status](https://travis-ci.org/juliuste/oebb.svg?branch=master)](https://travis-ci.org/juliuste/oebb)
[![Greenkeeper badge](https://badges.greenkeeper.io/juliuste/oebb.svg)](https://greenkeeper.io/)
[![dependency status](https://img.shields.io/david/juliuste/oebb.svg)](https://david-dm.org/juliuste/oebb)
[![license](https://img.shields.io/github/license/juliuste/oebb.svg?style=flat)](LICENSE)
[![chat on gitter](https://badges.gitter.im/juliuste.svg)](https://gitter.im/juliuste)

## Installation

```shell
npm install --save oebb
```

## Usage

This package mostly returns data in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format):

- [`stations(query)`](#stationsquery) - Search for stations
- [`journeys(origin, destination, date = new Date())`](#journeysorigin-destination-date--new-date) - Search for journeys between stations

### `stations(query)`

Using `oebb.stations`, you can query stations operated by ÖBB.

```js
const stations = require('oebb').stations

stations('Wien').then(console.log)
```

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve in an array of `station`s in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format) which looks as follows:

```js

[
    {
        "type": "station",
        "id": "1190100",
        "name": "Wien",
        "meta": true, // meta station (grouping multiple "real" stations)
        "coordinates": {
            "longitude": 16.372134,
            "latitude": 48.208547
        }
    },
    {
        "type": "station",
        "id": "1290401",
        "name": "Wien Hbf (U)",
        "meta": false,
        "coordinates": {
            "longitude": 16.375326,
            "latitude": 48.185507
        }
    },
    // …
]
```

Please note that this doesn't strictly follow the FPTF requirements as some of the stations are actually meta stations rather than physical locations (like `Wien` which probably represents multiple stations). Due to the lack of additional data, there sadly was no better way to implement them though (e.g. as `regions`).

### `journeys(origin, destination, date = new Date())`

Using `oebb.journeys`, you can get directions and prices (if available) for routes from A to B.

```js
const journeys = require('oebb').journeys

journeys(origin, destination, date = new Date())

const Vienna = '8103000'
const Munich = '8000261'
const date = new Date()

journeys(Vienna, Munich, date)
.then(console.log)
.catch(console.error)
```

Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/promise) that will resolve with an array of `journey`s in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format) which looks as follows.
*Note that the legs are not (fully) spec-compatible, as `schedule` is missing.*

```js
[
    {
        "type": "journey",
        "id": "fcb26082e79761ba30f4a56bb6dc9a6d36dd526b657303045a8608467d5a9f5e",
        "legs": [
            {
                "origin": {
                    "type": "station",
                    "id": "8103000",
                    "name": "Wien Hbf"
                },
                "destination": {
                    "type": "station",
                    "id": "8000261",
                    "name": "München Hbf"
                },
                "departure": "2017-10-28T08:22:00.000Z",
                "arrival": "2017-10-28T12:30:00.000Z",
                "departurePlatform": "8",
                "arrivalPlatform": "11",
                "realtime": true,
                "mode": "train", // either "train" or null
                "product": {
                    "name": "RJ",
                    "number": "60",
                    "displayName": "RJ",
                    "longName": {
                        "de": "Railjet",
                        "en": "Railjet"
                    },
                    "backgroundColor": "#ffffff",
                    "fontColor": "#222222",
                    "barColor": "#ab0020",
                    "place": {
                        "de": "Bahnsteig",
                        "en": "Platform"
                    },
                    "assistantIconId": "zugAssistant",
                    "train": true,
                    "backgroundColorDisabled": "#F0F0F0",
                    "fontColorDisabled": "#878787",
                    "barColorDisabled": "#878787"
                }
            }
        ],
        "price": { // null if not available
            "currency": "EUR",
            "amount": 97.8
        }
    },
    // …
]
```

## See also

- [FPTF](https://github.com/public-transport/friendly-public-transport-format) - "Friendly public transport format"
- [FPTF-modules](https://github.com/public-transport/friendly-public-transport-format/blob/master/modules.md) - modules that also use FPTF


## Contributing

If you found a bug, want to propose a feature or feel the urge to complain about your life, feel free to visit [the issues page](https://github.com/juliuste/oebb/issues).
