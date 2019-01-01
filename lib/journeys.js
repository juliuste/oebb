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
	amount: p
})

const createStation = (id, name) => ({
	type: 'station',
	id: id + '',
	name
})

const createServices = (c) => ({
	code: (c.price.firstClass === true) ? 1:2,
	description: (c.price.firstClass === true) ? "1st Class":"2nd Class",
	price: Math.round(c.price.price*100) + " EUR",
	seat_available: 999
})

const createOffers = (c) => ({
	code: (!c.price.specialNote) ? "Flex":"NonFlex",
	description: (!c.price.specialNote) ? "Flex Ticket":c.price.specialNote.en,
	services: [createServices(c)]
})

const createTrains = (s) => ({
	departure_station_name: s.from.name,
	departure_station_code: s.from.esn,
	destination_station_name: s.to.name,
	destination_station_code: s.to.esn,
	departure_at: new Date(s.from.departure),
	arrival_at: new Date(s.to.arrival),
	departurePlatform: s.from.departurePlatformDeviation || s.from.departurePlatform || null,
	arrivalPlatform: s.to.arrivalPlatformDeviation || s.to.arrivalPlatform || null,
	train_number: s.category.number,
	description: s.category.name + ' ' + s.category.number
})

const createSection = (c) => ({
	carrier_code: 'OEBB' + c.connection.sections[0].category.name,
	carrier_name: 'ÖBB ' + c.connection.sections[0].category.longName.en,
	departure_station_name: c.connection.sections[0].from.name,
	departure_station_code: c.connection.sections[0].from.esn,
	destination_station_name: c.connection.sections[c.connection.sections.length-1].to.name,
	destination_station_code: c.connection.sections[c.connection.sections.length-1].to.esn, 
	trains: c.connection.sections.map(createTrains),
	offers: [(c.price && isNumber(c.price.price)) ? createOffers(c) : null]
})

const createJourney = (c) => ({
	identity: c.connection.id,
	departure_station_name: c.connection.sections[0].from.name,
	departure_station_code: c.connection.sections[0].from.esn, 
	destination_station_name: c.connection.sections[c.connection.sections.length-1].to.name,
	destination_station_code: c.connection.sections[c.connection.sections.length-1].to.esn, 
	departure_at: new Date(c.connection.sections[0].from.departure),
	arrival_at: new Date(c.connection.sections[c.connection.sections.length-1].to.arrival),
	number_of_interchanges: c.connection.switches,
	travel_duration: Math.floor(c.connection.duration/3600000).toString() + ":" + Math.floor(((c.connection.duration/1000)%3600)/60).toString(),
	sections: [ createSection(c) ]
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

	return {
		'solutions': connectionsWithPrices.map(createJourney)
	}
}

module.exports = journeys
