'use strict'

const { journeys: validateArguments } = require('fpti-util').validateMethodArguments
const merge = require('lodash/merge')
const getKey = require('lodash/get')
const isNumber = require('lodash/isNumber')
const first = require('lodash/first')
const last = require('lodash/last')
const omit = require('lodash/omit')
const take = require('lodash/take')
const uniqBy = require('lodash/uniqBy')
const flow = require('lodash/fp/flow')
const sortBy = require('lodash/fp/sortBy')
const { DateTime } = require('luxon')

const { createGet, createPost, auth } = require('./helpers')

const createPrice = offer => {
	if (!offer) return null
	const { price, offerError, firstClass, availabilityState } = offer
	if (!isNumber(price) || Boolean(offerError) || availabilityState !== 'available') return null
	return {
		currency: 'EUR', // @todo
		amount: price,
		firstClass
	}
}

const oebbOperator = {
	type: 'operator',
	id: 'oebb',
	name: 'Österreichische Bundesbahnen',
	url: 'https://www.oebb.at/'
}

const createStation = rawStation => {
	const { name, esn } = rawStation
	return {
		type: 'station',
		id: String(esn),
		name
	}
}

const formatDate = date => {
	const zone = 'Europe/Vienna' // sigh…, @todo
	return DateTime.fromISO(date, { zone }).toISO({ suppressMilliseconds: true })
}

const createLeg = rawLeg => {
	const { from, to, category, hasRealtime } = rawLeg
	const { departure, departurePlatform = null } = from
	const { arrival, arrivalPlatform = null } = to
	const { name, number, shortName, longName, train } = category
	const lineName = [name, number].filter(Boolean).join(' ')
	return {
		origin: createStation(from),
		destination: createStation(to),
		departure: formatDate(departure),
		departurePlatform,
		arrival: formatDate(arrival),
		arrivalPlatform,
		hasRealtimeInformation: hasRealtime,
		line: {
			type: 'line',
			id: lineName,
			name: lineName,
			number,
			product: {
				name,
				shortName,
				longName
			},
			mode: train ? 'train' : 'bus', // sigh…, @todo
			public: true,
			operator: oebbOperator // sigh…, @todo
		},
		mode: train ? 'train' : 'bus', // sigh…, @todo
		public: true,
		operator: oebbOperator // sigh…, @todo
	}
}

const createJourney = (rawJourney, offer) => {
	const { id, sections: rawLegs } = rawJourney
	return {
		type: 'journey',
		id,
		legs: rawLegs.map(createLeg),
		price: createPrice(offer)
	}
}

// default options
// @todo: allow "external" pagination via timetableScroll method
const defaults = () => ({
	when: null,
	departureAfter: null,
	results: null,
	transfers: null,
	interval: null,
	prices: true
})

const journeys = async (origin, destination, opt = {}) => {
	const def = defaults()
	if (!(opt.departureAfter || opt.when)) def.departureAfter = new Date()
	const options = merge({}, def, opt)
	validateArguments(origin, destination, options) // @todo
	if (typeof options.prices !== 'boolean') throw new Error('`opt.prices` must be a boolean')

	if (typeof origin !== 'string') origin = origin.id
	if (typeof destination !== 'string') destination = destination.id

	const date = new Date(options.when || options.departureAfter)
	const endDate = DateTime.fromJSDate(date).plus({ minutes: options.interval || 0 }).toJSDate()

	// authenticate
	// @todo: don't create a new session per request
	const credentials = await auth()
	const get = createGet(credentials)
	const post = createPost(credentials)

	// fetch travel actions to obtain a travel action id (which references information
	// about the selected origin and destination)
	const { travelActions } = await post('https://tickets-mobile.oebb.at/api/offer/v2/travelActions', {
		datetime: date.toISOString(),
		from: {
			number: Number(origin),
			name: 'some station' // sigh…
		},
		to: {
			number: Number(destination),
			name: 'another station' // sigh…
		}
	})
	const travelAction = travelActions.find(travelAction => getKey(travelAction, 'entrypoint.id') === 'timetable')
	if (!travelAction) return [] // @todo throw an error here instead?
	const { id: travelActionId } = travelAction

	let arrivalsAfterEndDateFound = false
	let currentDate = date
	let lastConnectionId = null
	let journeys = []

	// eslint-disable-next-line no-labels
	fetchJourneys: do {
		// use the travel action id to lookup journeys
		const endpoint = lastConnectionId ? 'https://tickets-mobile.oebb.at/api/hafas/v1/timetableScroll' : 'https://tickets-mobile.oebb.at/api/hafas/v4/timetable'
		const { connections: rawJourneys } = await post(endpoint, omit({
			travelActionId,
			datetimeDeparture: new Date(date).toISOString(),
			datetimeArrival: '', // @todo
			sortType: 'DEPARTURE', // @todo
			filter: { // @todo
				bikes: false,
				changeTime: 0,
				direct: false,
				regionaltrains: false,
				trains: false,
				wheelchair: false
			},
			passengers: [ // @todo
				{
					challengedFlags: {
						hasAssistanceDog: false,
						hasAttendant: false,
						hasHandicappedPass: false,
						hasWheelchair: false,
						id: 0
					},
					id: Math.round(new Date() / 1000), // sigh…
					me: false,
					position: 0,
					remembered: false,
					type: 'ADULT'
				}
			],

			// pagination
			connectionId: lastConnectionId,
			count: 5, // @todo
			direction: 'after' // @todo
		}, lastConnectionId ? ['travelConnectionId', 'datetimeDeparture', 'datetimeArrival', 'passengers'] : ['connectionId', 'count', 'direction']))

		const rawJourneyIds = rawJourneys.map(({ id }) => id)
		const { offers = [] } = (options.prices && rawJourneyIds.length > 0) ? await get('https://tickets-mobile.oebb.at/api/offer/v1/prices', {
			connectionIds: rawJourneyIds,
			sortType: 'DEPARTURE' // @todo
		}) : {}

		// eslint-disable-next-line no-labels
		if (rawJourneys.length === 0) break fetchJourneys

		const newJourneys = flow([
			rawJourneys => rawJourneys.map(rawJourney => createJourney(rawJourney, offers.find(({ connectionId }) => connectionId === rawJourney.id))),
			sortBy(journey => +new Date(first(journey.legs).departure))
		])(rawJourneys)
		journeys.push(...newJourneys)

		const newCurrentDate = new Date(first(last(newJourneys).legs).departure)
		lastConnectionId = last(newJourneys).id
		// eslint-disable-next-line no-labels
		if (+newCurrentDate === +currentDate) break fetchJourneys
		currentDate = newCurrentDate
		arrivalsAfterEndDateFound = +currentDate > +endDate
	} while (!arrivalsAfterEndDateFound)

	journeys = uniqBy(journeys, 'id')
	if (typeof options.interval === 'number') journeys = journeys.filter(j => +new Date(first(j.legs).departure) <= +endDate)
	if (typeof options.transfers === 'number') journeys = journeys.filter(j => j.legs.length <= options.transfers + 1)
	if (typeof options.results === 'number') journeys = take(journeys, options.results)
	return journeys
}

module.exports = journeys
