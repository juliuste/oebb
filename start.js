'use strict'
const oebb = require('.')
const moment = require('moment-timezone')


const date = moment.tz('Europe/Vienna').add(20, 'days').set('hour', 8).startOf('hour').toDate()
oebb.journeys('8100108', '8103000', date)
  .then(console.log)
  .catch(console.error)