'use strict'

const { createGet, auth } = require('./helpers')
const merge = require('lodash/merge')
const take = require('lodash/take')
const isString = require('lodash/isString')

const defaults = {
	results: 10, // option seems to be ignored server-side
}

const createStation = (s) => ({
	type: 'station',
	id: String(s.number),
	name: s.name || s.meta, // @todo
	meta: Boolean(s.meta), // @todo
	location: {
		type: 'location',
		longitude: s.longitude / Math.pow(10, 6),
		latitude: s.latitude / Math.pow(10, 6),
	},
})

const search = async (query, opt = {}) => {
	if (!query || !isString(query)) {
		throw new Error('missing or invalid `query` parameter')
	}
	// eslint-disable-next-line no-unused-vars
	const options = merge(defaults, opt)

	// authenticate
	// @todo: don't create a new session per request
	const credentials = await auth()
	const get = createGet(credentials)

	const rawStations = await get('https://tickets.oebb.at/api/hafas/v1/stations', {
		// count: options.results, // currently ignored server-side
		name: query || null,
	})
	const stations = rawStations.map(createStation)
	return options.results ? take(stations, options.results) : stations
}
search.features = { results: 'Max. number of results returned' } // required by fpti

module.exports = { search }
