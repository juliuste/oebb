'use strict'
const oebb = require('.')
const moment = require('moment-timezone')


const date = moment.tz('Europe/Vienna').add(10, 'days').set('hour', 8).startOf('hour').toDate()
oebb.journeys('8100108', '8103000', date, 2, 1)
  .then(function(res){
    console.log(JSON.stringify(res))
  })
  .catch(console.error)