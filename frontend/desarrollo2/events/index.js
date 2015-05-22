var EventEmitter = require('events').EventEmitter;
var ee = new EventEmitter();
ee.setMaxListeners(100000);

module.exports = ee;