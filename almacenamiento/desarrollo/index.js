// #!/usr/bin/env node

/**
 * Module dependencies.
 */

var util = require('util');
//var extend = require('extend');
var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var http = require('http');
var dotenv = require('dotenv');
var crypto = require('crypto');
var mime = require('mime');

dotenv.load();

var webPort = process.env.WEB_PORT;
var filesPort = process.env.STORAGE_PORT;
var folder = process.env.STORAGE_FOLDER;
var frontendURL = process.env.FRONTEND_URL;

var io = require('socket.io').listen(filesPort), dl = require('delivery');

io.sockets.on('connection', function(socket) {
	var delivery = dl.listen(socket);

	socket.on('error', function(err) {
		log(3, err.stack);
	});

	delivery.on('receive.success', function(file) {
		fs.writeFile('./' + folder + '/' + file.name, file.buffer, function(err) {
			if (err) {
				log(3, 'File ' + file.name + ' could not be saved.');
			} else {
				log(1, 'File ' + file.name + " saved");
				http.get(frontendURL + "control/update?auth=sgpRadioLink&id=" + file.name.replace('.mp3', '') + "&state=" + 2, function(res) {
					log(1, 'File ' + file.name + " notified");
				}).on('error', function(e) {
					log(3, 'Error notifiying ' + file.name);
				});
			};
		});
	});
});

app.get('/delete/:hash([a-f0-9]+)/:id([0-9]+)', function(req, res) {
	var hash = crypto.createHash('md5').update(req.params.id).digest('hex');

	if (hash == req.params.hash) {

		fs.unlink('./grabaciones/' + req.params.id + '.mp3', function(err) {
			if (err) {
				log(2, 'File ' + req.params.id + ' doesn\'t exists, error deleting it');
				res.status(404).send('File not found');
			} else {
				log(1, 'File ' + req.params.id + ' deleted');
				res.status(202).send('ok');
			}

		});
	} else {
		log(3, 'Unautorized try of deleting ' + req.params.id);
		res.status(403).send('Sorry! you cant do that.');
	}

});

app.get('/stream/:reqid([0-9]+)', function(req, res) {
	var filePath = path.join(__dirname, '/grabaciones/' + req.params.reqid) + '.mp3';
	var stat = fs.statSync(filePath);

	res.writeHead(200, {
		'Content-Type' : 'audio/mp3',
		'Content-Length' : stat.size
	});

	var readStream = fs.createReadStream(filePath);
	readStream.pipe(res);

});

/* Ruta de descarga de audio */
app.get('/grabaciones/:file', function(req, res) {
	res.setHeader('Content-disposition', 'attachment; filename=' + req.params.file);
	res.setHeader('Content-type', 'audio/mp3');

	var file = __dirname + '/grabaciones/' + req.params.file;

	var filename = path.basename(file);
	var mimetype = mime.lookup(file);

	var filestream = fs.createReadStream(file);
	filestream.pipe(res);
});

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

