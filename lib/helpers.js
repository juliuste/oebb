'use strict'

const got = require('got')
const cookie = require('cookie')

const { version } = require('../package.json')

const auth = async () => {
	const { body } = await got.get('https://tickets-mobile.oebb.at/api/domain/v4/init', { json: true })
	return body
}

const get = async (url, params) => {
	const { accessToken } = await auth() // @todo: don't create a new session per request
	const { body } = await got.get(url, {
		json: true,
		headers: {
			AccessToken: accessToken,
			'User-Agent': `oebb-hafas ${version}`
		},
		query: params
	})
	return body
}

const post = (url, body) => (a) =>
	got.post(url, {
		json: true,
		headers: {
			cookie: cookie.serialize('ts-cookie', a.cookie),
			Channel: a.channel,
			AccessToken: a.accessToken,
			SessionId: a.sessionId,
			'x-ts-supportid': `WEB_${a.supportId}`
			// 'User-Agent': 'Ticketshop/4.62.0.347.11867 (iPhone; iOS 10.2.1; Scale/2.00)'
		},
		body
	})
		.then((res) => res.body)

module.exports = { auth, get, post }
