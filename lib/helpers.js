'use strict'

const got = require('got')
const { stringify } = require('query-string')

const { version } = require('../package.json')

const auth = async () => {
	const { body } = await got.get('https://tickets-mobile.oebb.at/api/domain/v4/init', { json: true })
	return body
}

const createGet = auth => async (url, params) => {
	const { accessToken, sessionId } = auth
	const { body } = await got.get(url, {
		json: true,
		headers: {
			sessionId,
			AccessToken: accessToken,
			'User-Agent': `oebb-hafas ${version}`
		},
		query: stringify(params, { arrayFormat: 'bracket' })
	})
	return body
}

const createPost = auth => async (url, params) => {
	const { accessToken, sessionId } = auth
	const { body } = await got.post(url, {
		json: true,
		headers: {
			sessionId,
			AccessToken: accessToken,
			'User-Agent': `oebb-hafas ${version}`
		},
		body: params
	})
	return body
}

module.exports = { auth, createGet, createPost }
