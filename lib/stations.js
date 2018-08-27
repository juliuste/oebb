'use strict'

const h = require('./helpers')
const merge = require('lodash/merge')
const isString = require('lodash/isString')

const defaults = {
	// results: 10 // option seems to be disabled server-side
}

const createStation = (s) => ({
	type: 'station',
	id: s.number + '',
	name: s.name || s.meta, // todo
	meta: !!s.meta, // todo
	coordinates: {
		longitude: s.longitude/Math.pow(10, 6), // todo
		latitude: s.latitude/Math.pow(10, 6) // todo
	}
})

const stations = (query, opt = {}) => {
	if(!query || !isString(query)){
		throw new Error('missing or invalid `query` parameter')
	}
	const options = merge(defaults, opt)
	return h.auth()
	.then(h.get('https://tickets.oebb.at/api/hafas/v1/stations', {
		// count: options.results,
		count: 10, // option seems to be disabled server-side
		name: query || null
	}))
	.then((res) => res.map(createStation))
}

module.exports = stations
