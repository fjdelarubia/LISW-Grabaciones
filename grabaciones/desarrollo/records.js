// #!/usr/bin/env node

/**
 * Module dependencies.
 */
process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
var program = require('commander');
var schedule = require('node-schedule');
var extend = require('extend');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var ip_frontend = "";

var exec = require('child_process').exec;

/*
 * 0 - Programada
 * 1 - Grabado
 * 2 - Lista
 * 3 - Error
 *
 */

var streamings = {
	RNE : 'http://rne.rtveradio.cires21.com/rne/mp3/icecast.audio?rnd=536018',
	RNEClass : 'http://radioclasica.rtveradio.cires21.com/radioclasica/mp3/icecast.audio?rnd=835585'
};

app.use(bodyParser.urlencoded({
	extended : true
}));
app.use(bodyParser.json());

var records = [];

var port = process.env.PORT || 8080;
// set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

router.route('/records').get(function(req, res) {
	res.json({
		records : records
	});
}).post(function(req, res) {
	var record = {};
	console.log(req.body);
	record.starting_date = req.body.starting_date;
	record.id = req.body.record_id;
	record.streaming = req.body.streaming;
	record.length = req.body.length;
	record.status = 0;

	records.push(record);
	res.json(record);

	programRecord(record);

});

router.route('/records/:record_id').delete(function(req, res) {
	var record;
	for (var i = 0; i < records.length; i++) {
		if (records[i].id == req.params.record_id) {
			record = records[i];
		}
	};
	if (record !== undefined) {
		record.schedule.cancel();
		record.status = "Deleted";
		res.json(record);
		return;
	}

	//ERROR

}).put(function(req, res) {
	var record;
	for (var i = 0; i < records.length; i++) {
		if (records[i].id == req.params.record_id) {
			record = records[i];
		}
	};
	if (record !== undefined) {
		extend(record, req.body);
	}
}).get(function(req, res) {
	var record;
	for (var i = 0; i < records.length; i++) {
		if (records[i].id == req.params.record_id) {
			record = records[i];
		}
	};

	record.url = record.id + ".mp3";
	res.json(record);
});

function programRecord(record) {
	var date = new Date(Date.parse(record.starting_date));
	console.log('Grabacion programada para : ' + date);
	var j = schedule.scheduleJob(date, function(y) {

		exec('ffmpeg -i ' + streamings[record.streaming] + ' -t ' + record.length + ':00 -acodec libmp3lame ' + record.id + '.mp3', function(error, stdout, stderr) {
			console.log(stdout);
		});

		record.status = "Recording";
		var nDate = new Date(date.getTime() + (record.length + 1) * 60000);
		var i = schedule.scheduleJob(nDate, function(y) {
			record.status = 2;
			http.get(ip_frontend + "/control/update?auth=" + + "sgpRadioLink&id=" + record.id + "&state=" + record.status, function(res) {
				console.log("Got response: " + res.statusCode);
			}).on('error', function(e) {
				console.log("Got error: " + e.message);
			});
			console.log("Recorded in " + record.id + '.mp3');
		});
		record.schedule = i;
	});
	record.schedule = j;
}

app.use('/', router);

app.listen(port);
// console.log('Magic happens on port ' + port);
//
// program.version('0.0.1').option('-p, --peppers', 'Add peppers').option('-P, --pineapple', 'Add pineapple').option('-b, --bbq', 'Add bbq sauce').option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble').parse(process.argv);
//
// console.log('you ordered a pizza with:');
// if (program.peppers)
// console.log('  - peppers');
// if (program.pineapple)
// console.log('  - pineapple');
// if (program.bbq)
// console.log('  - bbq');
// console.log('  - %s cheese', program.cheese);
//
// process.stdin.on('data', function(text) {
// util.inspect(text);
// var date = new Date(Date.parse(text.replace('\n', '')));
// var j = schedule.scheduleJob(date, function(y) {
// console.log(date.toString());
// });
// if (text === 'quit\n') {
// process.exit();
// }
// });

