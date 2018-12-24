'use strict'

const h = require('./helpers')
const merge = require('lodash/merge')
const isString = require('lodash/isString')
const isNumber = require('lodash/isNumber')
const queryString = require('query-string')

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

const createTrains = (s) => ({
	departure: s.from.name,
	departureStationCode: s.from.esn, 
	destination: s.to.name,
	destinationStationCode: s.to.esn, 
	departureAt: new Date(s.from.departure),
	arrivalAt: new Date(s.to.arrival),
	departurePlatform: s.from.departurePlatformDeviation || s.from.departurePlatform || null,
	arrivalPlatform: s.to.arrivalPlatformDeviation || s.to.arrivalPlatform || null,
	trainNumber: s.category.number,
	description: s.category.name + ' ' + s.category.number
})

const createSection = (c) => ({
	departure: c.connection.sections[0].from.name,
	departureStationCode: c.connection.sections[0].from.esn, 
	destination: c.connection.sections[c.connection.sections.length-1].to.name,
	destinationStationCode: c.connection.sections[c.connection.sections.length-1].to.esn, 
	departureAt: new Date(c.connection.sections[0].from.departure),
	arrivalAt: new Date(c.connection.sections[c.connection.sections.length-1].to.arrival),
	trains: c.connection.sections.map(createTrains)
	// offers: createOffers(s)
})

const createJourney = (c) => ({
	identity: c.connection.id,
	// sections: c.connection.sections.map(createSection),
	sections: createSection(c),
	price: (c.price && isNumber(c.price.price)) ? createPrice(c.price) : null
})

const journeys = async (origin, destination, date = new Date(), adults, children, opt = {}) => {
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

	const adultTemplate = {
		'type': 'ADULT',
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

	const childTemplate = {
		birthDate: "2013-12-17T00:00:00.000",
		birthdateChangeable: true,
		birthdateDeletable: true,
		cards: [],
		challengedFlags: {hasHandicappedPass: false, hasAssistanceDog: false, hasWheelchair: false, hasAttendant: false},
		fakeBirthDate: true,
		isSelected: false,
		me: false,
		nameChangeable: true,
		passengerDeletable: true,
		relations: [],
		remembered: false,
		type: "CHILD",
	}
	const newPaxId = function () {
		return Date.parse(Date())
	}

	const buildPassengers = function (numberOfAdult, numberOfChild) {
		var passengers = []
		var pax = {}
		for (let index = 0; index < numberOfAdult; index++) {
			pax = Object.assign({id: newPaxId()}, adultTemplate);
			passengers.push(pax)
		}
		
		for (let index = 0; index < numberOfChild; index++) {
			pax = Object.assign({id: newPaxId()}, childTemplate);
			passengers.push(pax)
		}
		return passengers
	}

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
		'passengers': buildPassengers(adults, children),
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

	const connectionsQuery = queryString.stringify({ connectionIds: connections.map((x) => x.id) }, { arrayFormat: 'bracket' })
	const prices = await h.get('https://tickets.oebb.at/api/offer/v1/prices', connectionsQuery
	)(auth).then((res) => res.offers)

	const connectionsWithPrices = connections.map((connection) => ({ connection, price: prices.find((x) => x.connectionId === connection.id) }))

	return connectionsWithPrices.map(createJourney)
}

module.exports = journeys
