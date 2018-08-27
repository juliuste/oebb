'use strict'

const request = require('got')
const random = require('randomatic')
const cookie = require('cookie')
const merge = require('lodash/merge')
const retry = require('p-retry')

const generateDeviceId = () => `${random('A0', 8)}-${random('A0', 4)}-${random('A0', 4)}-${random('A0', 4)}-${random('A0', 12)}`
const generateUserId = () => `anonym-${random('A0', 8)}-${random('A0', 4)}-${random('A0', 2)}`.toLowerCase()

const authRequest = () => {
	return request.get('https://tickets.oebb.at/api/domain/v3/init', {
		json: true,
		headers: {
			Channel: 'inet'
		},
		query: {
			userId: generateUserId()
		},
		timeout: 5000 // todo
	})
	.then((res) => merge(res.body, {
		cookie: cookie.parse(res.headers['set-cookie'][0])['ts-cookie']
	}))
}
const auth = () => retry(authRequest, {retries: 3})

const get = (url, params) => (a) =>
	request.get(url, {
		json: true,
		headers: {
			cookie: cookie.serialize('ts-cookie', a.cookie),
			Channel: a.channel,
			AccessToken: a.accessToken,
			SessionId: a.sessionId,
			'x-ts-supportid': `WEB_${a.supportId}`,
			// 'User-Agent': 'Ticketshop/4.62.0.347.11867 (iPhone; iOS 10.2.1; Scale/2.00)'
		},
		query: params
	})
	.then((res) => res.body)

const post = (url, body) => (a) =>
	request.post(url, {
		json: true,
		headers: {
			cookie: cookie.serialize('ts-cookie', a.cookie),
			Channel: a.channel,
			AccessToken: a.accessToken,
			SessionId: a.sessionId,
			'x-ts-supportid': `WEB_${a.supportId}`,
			// 'User-Agent': 'Ticketshop/4.62.0.347.11867 (iPhone; iOS 10.2.1; Scale/2.00)'
		},
		body
	})
	.then((res) => res.body)

module.exports = {auth, get, post}
