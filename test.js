'use strict'

const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)
const isString = require('lodash/isString')
const isDate = require('lodash/isDate')
const isObject = require('lodash/isObject')
const moment = require('moment-timezone')
const validate = require('validate-fptf')()
const oebb = require('.')

tape('stations', async t => {
	const stations = await oebb.stations('Wien', { results: 4 })
	t.ok(stations.length === 4, 'stations length')
	stations.forEach(station => {
		t.doesNotThrow(() => validate(station), 'valid fptf')
		t.ok(station.location.longitude > 16 && station.location.longitude < 17, 'station location longitude')
		t.ok(station.location.latitude > 48 && station.location.latitude < 49, 'station location latitude')
	})
	t.ok(stations.find(({ name, meta }) => name === 'Wien' && meta === true), 'wien station')
})

tape('oebb.journeys', async (t) => {
	t.plan(14)
	const date = moment.tz('Europe/Vienna').add(2, 'days').set('hour', 8).startOf('hour').toDate()
	const journeys = await oebb.journeys('8000261', '8103000', date) // München -> Wien
	t.ok(journeys.length >= 1, 'journeys length')
	const journey = journeys[0]
	t.ok(journey.type === 'journey', 'journey type')
	t.ok(isString(journey.id) && journey.id.length > 10, 'journey id')
	t.ok(Array.isArray(journey.legs) && journey.legs.length >= 1, 'journey legs length')
	const leg = journey.legs[0]
	t.ok(leg.origin.type === 'station', 'journey leg origin type')
	t.ok(isString(leg.origin.id) && leg.origin.id.length >= 6, 'journey leg origin id')
	t.ok(leg.origin.name === 'München Hbf', 'journey leg origin name')
	t.ok(leg.destination.type === 'station', 'journey leg destination type')
	t.ok(isString(leg.destination.id) && leg.destination.id.length >= 6, 'journey leg destination id')
	t.ok(leg.destination.name === 'Wien Hbf', 'journey leg destination name')
	t.ok(isDate(leg.departure), 'journey leg departure')
	t.ok(isDate(leg.arrival), 'journey leg arrival')
	t.ok(+leg.departure < +leg.arrival, 'journey leg departure before arrival')
	t.ok(isObject(leg.product), 'journey leg product')
})
