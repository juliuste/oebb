'use strict'

const tapeWithoutPromise = require('tape')
const addPromiseSupport = require('tape-promise').default
const tape = addPromiseSupport(tapeWithoutPromise)
const first = require('lodash/first')
const last = require('lodash/last')
const { DateTime } = require('luxon')
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

tape('journeys', async t => {
	const berlin = '8011160'
	const hamburg = '8002549'
	const vienna = {
		type: 'station',
		id: '1190100',
		name: 'Wien'
	}
	const when = DateTime.fromJSDate(new Date(), { zone: 'Europe/Vienna' }).plus({ days: 10 }).startOf('day').plus({ hours: 5 }).toJSDate()
	const journeys = await oebb.journeys(berlin, vienna, { when })

	t.ok(journeys.length === 5, 'number of journeys')
	journeys.forEach(journey => {
		t.doesNotThrow(() => validate(journey), 'valid fptf')
		t.ok(first(journey.legs).origin.name.toLowerCase().includes('berlin'), 'origin')
		t.ok(last(journey.legs).destination.name.toLowerCase().includes('wien'), 'destination')
		journey.legs.forEach(leg => {
			t.ok(leg.line.type === 'line', 'leg line')
			t.doesNotThrow(() => validate(leg.line), 'valid fptf')
		})
	})

	const directJourneys = await oebb.journeys(vienna, hamburg, { when, transfers: 0 })
	t.ok(directJourneys.length === 0, 'number of direct journeys')

	const twoTransferJourneys = await oebb.journeys(vienna, hamburg, { when, transfers: 2 })
	t.ok(twoTransferJourneys.length > 0, 'number of 1- or 2-transfer journeys')

	const fewJourneys = await oebb.journeys(berlin, vienna, { departureAfter: when, results: 2 })
	t.ok(fewJourneys.length === 2, 'number of journeys')

	const oneDayLater = DateTime.fromJSDate(when).plus({ days: 1 }).toJSDate()
	const thirtySixHours = 36 * 60
	const manyJourneys = await oebb.journeys(berlin, vienna, { when, interval: thirtySixHours })
	t.ok(manyJourneys.length >= 10, 'number of journeys')
	const journeysOneDayLater = manyJourneys.filter(j => +new Date(first(j.legs).departure) > +oneDayLater)
	t.ok(journeysOneDayLater.length >= 2, 'number of journeys')
})
