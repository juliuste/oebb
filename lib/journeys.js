'use strict'

const h = require('./helpers')
const merge = require('lodash/merge')
const isString = require('lodash/isString')
const isNumber = require('lodash/isNumber')

// todo: options
const defaults = {}

const createPrice = (p) => ({
	currency: 'EUR', // todo
	amount: +p.price
})

const createStation = (id, name) => ({
	type: 'station',
	id: id + '',
	name
})

const createLeg = (l) => ({
	origin: createStation(l.from.esn, l.from.name),
	destination: createStation(l.to.esn, l.to.name),
	departure: new Date(l.from.departure),
	arrival: new Date(l.to.arrival),
	departurePlatform: l.from.departurePlatformDeviation || l.from.departurePlatform || null,
	arrivalPlatform: l.to.arrivalPlatformDeviation || l.to.arrivalPlatform || null,
	realtime: l.hasRealtime, // todo
	mode: l.category.train ? 'train' : null,
	product: l.category // todo
})

const createJourney = (c) => ({
	type: 'journey',
	id: c.connection.id,
	legs: c.connection.sections.map(createLeg),
	price: (c.price && isNumber(c.price.price)) ? createPrice(c.price) : null
})

const journeys = async (origin, destination, date = new Date(), opt = {}) => {
	// eslint-disable-next-line no-unused-vars
	const options = merge(defaults, opt)

	if (isString(origin)) origin = { id: origin, type: 'station' }
	if (isString(destination)) destination = { id: destination, type: 'station' }

	if (!isString(origin.id)) throw new Error('invalid or missing origin id')
	if (origin.type !== 'station') throw new Error('invalid or missing origin type')
	if (!isString(destination.id)) throw new Error('invalid or missing destination id')
	if (destination.type !== 'station') throw new Error('invalid or missing destination type')

	origin = origin.id
	destination = destination.id

	const auth = await h.auth()

	// probably unnecessary code, therefore not used but not yet deleted

	// const actions = await h.post('https://tickets.oebb.at/api/offer/v2/travelActions', {
	//     "from": {
	//         "number": origin
	//     },
	//     "to": {
	//         "number": destination
	//     },
	//     "filter": {
	//         "productTypes": [],
	//         "history": true,
	//         "maxEntries": 5,
	//         "channel": "inet"
	//     }
	// })(auth)
	//
	// const action = actions.travelActions.find((x) => x.subtitle.de === 'Einzeltickets und Tageskarten') // todo
	// if(!action) throw new Error('invalid actions returned')

	const connections = await h.post('https://tickets.oebb.at/api/hafas/v4/timetable', {
		// "travelActionId": action.id,
		'reverse': false,
		'datetimeDeparture': new Date(date),
		'filter': {
			'regionaltrains': false,
			'direct': false,
			'changeTime': false,
			'wheelchair': false,
			'bikes': false,
			'trains': false,
			'motorail': false,
			'droppedConnections': false
		},
		'passengers': [
			{
				'type': 'ADULT',
				'id': 1509169236,
				'me': false,
				'remembered': false,
				'challengedFlags': {
					'hasHandicappedPass': false,
					'hasAssistanceDog': false,
					'hasWheelchair': false,
					'hasAttendant': false
				},
				'relations': [],
				'cards': [],
				'birthdateChangeable': true,
				'birthdateDeletable': true,
				'nameChangeable': true,
				'passengerDeletable': true
			}
		],
		'count': 5, // must be <= 5
		'debugFilter': {
			'noAggregationFilter': false,
			'noEqclassFilter': false,
			'noNrtpathFilter': false,
			'noPaymentFilter': false,
			'useTripartFilter': false,
			'noVbxFilter': false,
			'noCategoriesFilter': false
		},
		'from': {
			'number': origin
		},
		'to': {
			'number': destination
		},
		'timeout': {}
	})(auth).then((res) => res.connections)

	const prices = await h.get('https://tickets.oebb.at/api/offer/v1/prices', {
		connectionIds: connections.map((x) => x.id)
	})(auth).then((res) => res.offers)

	const connectionsWithPrices = connections.map((connection) => ({ connection, price: prices.find((x) => x.connectionId === connection.id) }))

	return connectionsWithPrices.map(createJourney)
}

module.exports = journeys
