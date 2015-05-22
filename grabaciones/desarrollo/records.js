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
var path = require('path');
var fs = require('fs');
var http = require('http');
var mime = require('mime');
var dotenv = require('dotenv');

var exec = require('child_process').exec;
var dl = require('delivery');

dotenv.load();

var frontendUrl = process.env.FRONTEND_URL;
var webPort = process.env.WEB_PORT;
var filesPort = process.env.STORAGE_PORT;
var filesServer = process.env.STORAGE_SERVER;
var folder = process.env.FOLDER;

/*
 * 0 - Programada
 * 1 - Grabado
 * 2 - Lista
 * 3 - Error
 * 4 - Eliminada
 */

var io = require('socket.io-client');

var streamings = {
	RNE : 'http://rne.rtveradio.cires21.com/rne/mp3/icecast.audio?rnd=536018',
	cadena100 : 'http://195.55.74.224/cope/cadena100.mp3',
	ser : 'http://4123.live.streamtheworld.com/CADENASER_SC',
	los40 : 'http://5243.live.streamtheworld.com/LOS40_SC',
	cope : 'http://195.55.74.208/cope/net1.mp3',
	RNEClass : 'http://radioclasica.rtveradio.cires21.com/radioclasica/mp3/icecast.audio?rnd=835585'
};

app.use(bodyParser.urlencoded({
	extended : true
}));
app.use(bodyParser.json());

var records = [];

var router = express.Router();

router.route('/records').get(function(req, res) {
	res.json({
		records : records
	});
}).post(function(req, res) {
	var record = {};
	record.starting_date = req.body.starting_date;
	record.id = req.body.record_id;
	record.streaming = req.body.streaming;
	record.length = Number(req.body.length);
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
		log(1, 'Canceled ' + record.id);
		record.schedule.cancel();
		record.status = 4;
		res.json(record);
		return;
	} else {
		log(2, 'Record ' + record.id + ' doesn\'t exists, nothing to cancel');
	}
}).put(function(req, res) {
	var record;
	for (var i = 0; i < records.length; i++) {
		if (records[i].id == req.params.record_id) {
			record = records[i];
		}
	};
	if (record !== undefined) {
		log(1, 'Updated record ' + record.id);
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
	log(1, 'Record ' + record.id + ' scheduled for ' + date.toString());
	var j = schedule.scheduleJob(date, function() {

		log(1, 'Record ' + record.id + ' starting');
		exec('ffmpeg -i ' + streamings[record.streaming] + ' -t ' + record.length + ':00 -acodec libmp3lame ./grabaciones/' + record.id + '.mp3', function(error, stdout, stderr) {
			if(stdout)
			log(3, stdout);
		});
		record.status = 1;

		http.get(frontendUrl + "control/update?auth=sgpRadioLink&id=" + record.id + "&state=" + record.status, function(res) {
			log(1, 'File ' + record.id + " notified");
		}).on('error', function(e) {
			log(3, 'Error notifiying ' + file.name);
		});

		var nDate = new Date(date.getTime() + (record.length + 1) * 60000);
		var i = schedule.scheduleJob(nDate, function() {
			var socket = io.connect(filesServer + ':' + filesPort);
			socket.on('error', function(err) {
				if (error)
					log(3, err.stack);
			});
			socket.on('connect', function() {
				var delivery = dl.listen(socket);
				delivery.connect();
				delivery.on('delivery.connect', function(delivery) {
					if (record.status == 1) {
						delivery.send({
							name : record.id + '.mp3',
							path : './grabaciones/' + record.id + '.mp3'
						});
						delivery.on('send.success', function(file) {
							log(1, 'File ' + './grabaciones/' + record.id + '.mp3' + ' successfully sent to store');
							record.status = 2;
							fs.unlink('./grabaciones/' + record.id + '.mp3', function(err) {
								if (err) {
									log(3, err.stack);
								} else {
									log(1, 'Successfully deleted ' + './grabaciones/' + record.id + '.mp3');
								}
							});
							socket.disconnect();
						});
					}
				});
			});

		});
		record.schedule = i;
	});
	record.schedule = j;
}

app.use('/', router);

function log(level, message) {
	var trace = "";
	switch(level) {
	case 1:
		trace += "[inf] ";
		break;
	case 2:
		trace += "[war] ";
		break;
	case 3:
		trace += "[err] ";
		break;
	}

	trace += " - " + (new Date()).toString() + " - " + message;

	console.log(trace);

}

app.listen(webPort);

