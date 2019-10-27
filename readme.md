# oebb

Client for the [Austrian Federal Railways (ÖBB)](https://oebb.at/) API. Inofficial, using endpoints by *ÖBB*. Ask them for permission before using this module in production. **Actually, there should be no need for projects like this since endpoints for state-owned public transportation operators should be open to the public. It's ~~2017, 2018~~ 2019. By the way: Even [Deutsche Bahn](http://www.bahn.de/) gets this now, and you don't ever want to be less progressive than them, because that would hurt their pride 😄.**

This module conforms to the [FPTI-JS `0.3.2` standard](https://github.com/public-transport/fpti-js/tree/0.3.2) for JavaScript public transportation modules.

[![npm version](https://img.shields.io/npm/v/oebb.svg)](https://www.npmjs.com/package/oebb)
[![Build Status](https://travis-ci.org/juliuste/oebb.svg?branch=master)](https://travis-ci.org/juliuste/oebb)
[![Greenkeeper badge](https://badges.greenkeeper.io/juliuste/oebb.svg)](https://greenkeeper.io/)
[![license](https://img.shields.io/github/license/juliuste/oebb.svg?style=flat)](license)
[![fpti-js version](https://fpti-js.badges.juliustens.eu/badge/juliuste/oebb)](https://fpti-js.badges.juliustens.eu/link/juliuste/oebb)

## Installation

```shell
npm install oebb
```

## Usage

```js
const oebb = require('oebb')
```

The `oebb` module conforms to the [FPTI-JS `0.3.2` standard](https://github.com/public-transport/fpti-js/tree/0.3.2) for JavaScript public transportation modules and exposes the following methods:

Method | Feature description | [FPTI-JS `0.3.2`](https://github.com/public-transport/fpti-js/tree/0.3.2)
-------|---------------------|--------------------------------------------------------------------
[`stations.search(query, [opt])`](#stationssearchquery-opt) | Search stations by *query*. | [✅ yes](https://github.com/public-transport/fpti-js/blob/0.3.2/docs/stations-stops-regions.search.md)
[`journeys(origin, destination, [opt])`](#journeysorigin-destination-opt) | Journeys between stations | [✅ yes](https://github.com/public-transport/fpti-js/blob/0.3.2/docs/journeys.md)

---

### `stations.search(query, [opt])`

Search stations by *query*. See [this method in the FPTI-JS `0.3.2` spec](https://github.com/public-transport/fpti-js/blob/0.3.2/docs/stations-stops-regions.search.md).

#### Supported Options

Attribute | Description | FPTI-spec | Value type | Default
----------|-------------|------------|------------|--------
`results` | Max. number of results returned | ✅ | `Number` | `null`

#### Example

```js
oebb.stations.search('Wie', { results: 2 }).then(…)
```

```js
[
		{
			type: 'station',
			id: '1190100',
			name: 'Wien',
			meta: true, // indicates that this is a "meta" station, actually representing a group of stations, corresponding to the city of vienna in this case
			location: {
				type: 'location',
				longitude: 16.372134,
				latitude: 48.208547
			}
		},
		{
			type: 'station',
			id: '1290401',
			name: 'Wien Hbf (U)',
			meta: false,
			location: {
				type: 'location',
				longitude: 16.375326,
				latitude: 48.185507
			}
		}
	]
```

---

### `journeys(origin, destination, [opt])`

Find journeys between stations. See [this method in the FPTI-JS `0.3.2` spec](https://github.com/public-transport/fpti-js/blob/0.3.2/docs/journeys.md).

#### Supported Options

Attribute | Description | FPTI-spec | Value type | Default
----------|-------------|------------|------------|--------
`when` | Journey date, synonym to `departureAfter` | ✅ | [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/date) | `new Date()`
`departureAfter` | List journeys with a departure (first leg) after this date | ✅ | [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/date) | `new Date()`
`results` | Max. number of results returned | ✅ | `Number` | `null`
`interval` | Results for how many minutes after `when`/`departureAfter` | ✅ | `Number` | `null`
`transfers` | Max. number of transfers | ✅ | `Number` | `null`
`prices` | Add price information to journeys (spawning an additional request internally) | ❌ | `Boolean` | `true`

#### Example

```js
const berlin = '8011160' // station id
const vienna = { // FPTF station
    type: 'station',
    id: '1190100',
    name: 'Wien'
    // …
}

oebb.journeys(berlin, vienna, { when: new Date('2019-11-02T05:00:00+02:00'), results: 1 }).then(…)
```

```js
[
	{
		type: 'journey',
		id: 'fb829242f221c309fb7fecf4fe87a7e169c084b23274d3c1d1f1a1ce2aed040b',
		legs: [
			{
				origin: {
					type: 'station',
					id: '8098160',
					name: 'Berlin Hbf (tief)'
				},
				destination: {
					type: 'station',
					id: '8010205',
					name: 'Leipzig Hbf'
				},
				departure: '2019-11-02T04:28:00+01:00',
				departurePlatform: '2',
				arrival: '2019-11-02T05:42:00+01:00',
				arrivalPlatform: '12',
				hasRealtimeInformation: false,
				line: {
					type: 'line',
					id: 'ICE 501',
					name: 'ICE 501',
					number: '501',
					product: {
						name: 'ICE',
						shortName: 'ICE',
						longName: {
							de: 'Intercity Express',
							en: 'Intercity Express',
							it: 'Intercity express'
						}
					},
					mode: 'train',
					public: true,
					operator: {
						type: 'operator',
						id: 'oebb',
						name: 'Österreichische Bundesbahnen',
						url: 'https://www.oebb.at/'
					}
				},
				mode: 'train',
				public: true,
				operator: {
					type: 'operator',
					id: 'oebb',
					name: 'Österreichische Bundesbahnen',
					url: 'https://www.oebb.at/'
				}
			},
			{
				origin: {
					type: 'station',
					id: '8010205',
					name: 'Leipzig Hbf'
				},
				destination: {
					type: 'station',
					id: '5400014',
					name: 'Praha hl.n.'
				},
				departure: '2019-11-02T05:54:00+01:00',
				departurePlatform: '15',
				arrival: '2019-11-02T09:26:00+01:00',
				arrivalPlatform: null,
				hasRealtimeInformation: false,
				line: {
					type: 'line',
					id: 'EC 259',
					name: 'EC 259',
					number: '259',
					product: {
						name: 'EC',
						shortName: 'EC',
						longName: {
							de: 'Eurocity',
							en: 'Eurocity',
							it: 'eurocity'
						}
					},
					mode: 'train',
					public: true,
					operator: {
						type: 'operator',
						id: 'oebb',
						name: 'Österreichische Bundesbahnen',
						url: 'https://www.oebb.at/'
					}
				},
				mode: 'train',
				public: true,
				operator: {
					type: 'operator',
					id: 'oebb',
					name: 'Österreichische Bundesbahnen',
					url: 'https://www.oebb.at/'
				}
			},
			{
				origin: {
					type: 'station',
					id: '5400014',
					name: 'Praha hl.n.'
				},
				destination: {
					type: 'station',
					id: '5400202',
					name: 'Breclav'
				},
				departure: '2019-11-02T09:50:00+01:00',
				departurePlatform: null,
				arrival: '2019-11-02T12:52:00+01:00',
				arrivalPlatform: null,
				hasRealtimeInformation: false,
				line: {
					type: 'line',
					id: 'EC 277',
					name: 'EC 277',
					number: '277',
					product: {
						name: 'EC',
						shortName: 'EC',
						longName: {
							de: 'Eurocity',
							en: 'Eurocity',
							it: 'eurocity'
						}
					},
					mode: 'train',
					public: true,
					operator: {
						type: 'operator',
						id: 'oebb',
						name: 'Österreichische Bundesbahnen',
						url: 'https://www.oebb.at/'
					}
				},
				mode: 'train',
				public: true,
				operator: {
					type: 'operator',
					id: 'oebb',
					name: 'Österreichische Bundesbahnen',
					url: 'https://www.oebb.at/'
				}
			},
			{
				origin: {
					type: 'station',
					id: '5400202',
					name: 'Breclav'
				},
				destination: {
					type: 'station',
					id: '8103000',
					name: 'Wien Hbf'
				},
				departure: '2019-11-02T12:55:00+01:00',
				departurePlatform: null,
				arrival: '2019-11-02T13:49:00+01:00',
				arrivalPlatform: '7C-E',
				hasRealtimeInformation: false,
				line: {
					type: 'line',
					id: 'EC 103',
					name: 'EC 103',
					number: '103',
					product: {
						name: 'EC',
						shortName: 'EC',
						longName: {
							de: 'Eurocity',
							en: 'Eurocity',
							it: 'eurocity'
						}
					},
					mode: 'train',
					public: true,
					operator: {
						type: 'operator',
						id: 'oebb',
						name: 'Österreichische Bundesbahnen',
						url: 'https://www.oebb.at/'
					}
				},
				mode: 'train',
				public: true,
				operator: {
					type: 'operator',
					id: 'oebb',
					name: 'Österreichische Bundesbahnen',
					url: 'https://www.oebb.at/'
				}
			}
		],
		price: {
			currency: 'EUR',
			amount: 186.4,
			firstClass: false
		}
	}
]
```

## Contributing

If you found a bug or want to propose a feature, feel free to visit [the issues page](https://github.com/juliuste/oebb/issues).
