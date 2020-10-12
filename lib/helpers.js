'use strict'

const got = require('got')
const { stringify } = require('query-string')

const { version } = require('../package.json')

const auth = async () => {
	const { body } = await got.get('https://tickets-mobile.oebb.at/api/domain/v4/init', { responseType: 'json' })
	return body
}

const createGet = auth => async (url, params) => {
	const { accessToken, sessionId } = auth
	const { body } = await got.get(url, {
		headers: {
			sessionId,
			AccessToken: accessToken,
			'User-Agent': `oebb-hafas ${version}`,
		},
		searchParams: stringify(params, { arrayFormat: 'bracket' }),
		responseType: 'json',
	})
	return body
}

const createPost = auth => async (url, params) => {
	const { accessToken, sessionId } = auth
	const { body } = await got.post(url, {
		headers: {
			sessionId,
			AccessToken: accessToken,
			'User-Agent': `oebb-hafas ${version}`,
		},
		json: params,
		responseType: 'json',
	})
	return body
}

module.exports = { auth, createGet, createPost }
