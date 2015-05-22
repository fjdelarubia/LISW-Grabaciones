var models = require('../models');
var express = require('express');
var request = require('request');
var router = express.Router();
var http = require('http');

exports.load = function(req, res, next, id) {
	models.Grab.find(id).then(function(grab) {
		if (grab) {
			req.grab = grab;
			next();
		} else {
			req.flash('error', 'No existe la grabacion con id=' + id + '.');
			res.redirect('/login');
		}
	}).catch(function(error) {
		next(error);
	});
};

exports.delete = function(req, res, next) {
	http.get(process.env.STORAGE_URL + "delete/" + req.params.hash + "/" + req.params.id, function(response) {
		if (response.statusCode == 202) {
			models.Grab.find(id).then(function(g) {
				if (req.session.user.id == g.userid) {
					//borrar la grabacion
					g.destroy().then(function() {
						models.User.find(req.session.user.id).then(function(user) {
							var g = user.grabaciones;
							if (g < 20) {
								user.grabaciones = g + 1;
							}
							user.save(['grabaciones']).then(function() {
								res.status(202).send('ok');
							}).catch(function(error) {
								res.status(500).send('ok');
							});
						}).catch(function(error) {
							res.status(500).send('ok');
						});
					}).catch(function(error) {
						res.status(500).send('ok');
					});

				} else {
					res.status(500).send('ok');
				}
			}).catch(function(error) {
				next(error);
			});
			res.status(202).send('ok');
		} else {
			res.status(500).send('nok');
		}
		
	}).on('error', function(e) {
		res.status(500).send('nok');
	});
};

exports.controlaLimite = function(req, res, next) {
	models.User.find(req.session.user.id).then(function(user) {
		if (user) {
			var restantes = user.grabaciones;
			if (restantes == 0) {
				req.flash('info', 'No tienes créditos para solicitar una nueva grabación. Puedes borrar una grabación solicitada anteriormente o conseguir más créditos');
				res.redirect('/grabaciones');
			} else {
				next();
			}
		} else {
			req.flash('error', 'Por favor, utiliza la interfaz web para solicitar una grabación.');
			res.redirect('/login');
		}
	}).catch(function(error) {
		next(error);
	});
};

exports.new = function(req, res, next) {
	res.render('grabs/index');
};

exports.create = function(req, res, next) {

	var f = req.body.fecha;
	var r = req.body.emisora;
	var d = req.body.duracion;
	var h = req.body.hora.split(":")[0];
	var m = req.body.hora.split(":")[1] || 0;

	var fechaInicio = formatControl(f.split("/"), r, d, h, m);

	var fechaInicio = formatControl(f.split("/"), r, d, h, m);
	if ( typeof (fechaInicio) == 'undefined') {
		req.flash('error', 'Por favor, comprueba los datos que has introducido.');
		res.redirect('/grabar');
	} else {

		var checked = 0;
		if (req.body.emailchecked == "on") {
			checked = 1;
		}

		var grabacion = models.Grab.build({
			radio : r,
			inicio : fechaInicio,
			duracion : d,
			estado : 0,
			leido : 0,
			email : checked,
			userid : req.session.user.id
		});

		// enviar al servidor de Java la solicitud de grabación
		var nextURL = "/records/";
		grabacion.save().then(function() {
			request.post(process.env.JAVASERVER_URL + nextURL, {
				form : {
					starting_date : grabacion.inicio,
					streaming : grabacion.radio,
					length : grabacion.duracion,
					record_id : grabacion.id
				}
			}, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					//si todo ha salido bien, almacenar la grabación
					models.User.find(req.session.user.id).then(function(user) {
						var grabaciones = user.grabaciones;
						user.grabaciones = grabaciones - 1;
						user.save(['grabaciones']).then(function() {
							req.flash("success", "Su petición ha quedado registrada. Se le notificará cuando la grabación esté lista");
							res.redirect('/grabaciones');
						}).catch(function(error) {
							next(error);
						});
					}).catch(function(error) {
						next(error);
					});
				} else {
					console.log("-------------------------------------Servidor responde con error");
				}
			});
		}).catch(function(error) {
			next(error);
		});
	}
};

exports.index = function(req, res, next) {
	var indice = req.query.index || 1;
	var i = indice * 3 - 3;

	var estados = ['espera', 'grabando', 'listas', 'error'];
	var show = req.query.show || 'todas';
	var s = estados.indexOf(show);
	if (s != -1) {
		models.Grab.findAll({
			where : ['userid = ? AND estado=?', req.session.user.id, s],
			order : 'createdAt DESC'
		}).then(function(grabaciones) {
			if (grabaciones.length <= 3) {
				res.render('grabs/todas', {
					grabs : grabaciones,
					pages : 1,
					index : indice,
					selected : show
				});
			} else {
				res.render('grabs/todas', {
					grabs : grabaciones.slice(i, i + 3),
					pages : Math.ceil(grabaciones.length / 3),
					index : indice,
					selected : show
				});
			}
		}).catch(function(error) {
			next(error);
		});
	} else {
		models.Grab.findAll({
			where : ['userid = ?', req.session.user.id],
			order : 'createdAt DESC'
		}).then(function(grabaciones) {
			if (grabaciones.length <= 3) {
				res.render('grabs/todas', {
					grabs : grabaciones,
					pages : 1,
					index : indice,
					selected : show
				});
			} else {
				res.render('grabs/todas', {
					grabs : grabaciones.slice(i, i + 3),
					pages : Math.ceil(grabaciones.length / 3),
					index : indice,
					selected : show
				});
			}
		}).catch(function(error) {
			next(error);
		});
	}
};

exports.edit = function(req, res, next) {
	res.render('grabs/index', {
		grab : req.grab
	});
};

exports.update = function(req, res, next) {

	var f = req.body.fecha;
	var r = req.body.emisora;
	var d = req.body.duracion;
	var h = req.body.hora.split(":")[0];
	var m = req.body.hora.split(":")[1] || 0;

	var fechaInicio = formatControl(f.split("/"), r, d, h, m);
	if ( typeof (fechaInicio) == 'undefined') {
		req.flash('error', 'Por favor, comprueba los datos que has introducido');
		res.redirect('/grabaciones');
	} else {

		//sacar el checked de email
		var checked = 0;
		if (req.body.emailchecked == "on") {
			checked = 1;
		}

		// campos a actualizar
		var updates = ['radio', 'inicio', 'email', 'duracion'];
		req.grab.radio = req.body.emisora;
		req.grab.inicio = fechaInicio;
		req.grab.email = checked;
		req.grab.duracion = parseInt(req.body.duracion);

		req.grab.save(updates).then(function() {
			req.flash('success', 'Se ha editado tu grabación con éxito!');
			res.redirect('/grabaciones');
		}).catch(function(error) {
			next(error);

		});

	}

};
exports.destroy = function(req, res, next) {
	var id = req.body.grabid;
	models.Grab.find(id).then(function(g) {
		if (req.session.user.id == g.userid) {
			//borrar la grabacion
			g.destroy().then(function() {
				models.User.find(req.session.user.id).then(function(user) {
					var g = user.grabaciones;
					if (g < 20) {
						user.grabaciones = g + 1;
					}
					user.save(['grabaciones']).then(function() {
						req.flash('success', 'Se ha borrado tu solicitud. Tienes un crédito más');
						res.redirect('/grabaciones');
					}).catch(function(error) {
						next(error);
					});
				}).catch(function(error) {
					next(error);
				});
			}).catch(function(error) {
				next(error);
			});

		} else {
			res.send(403);
		}
	}).catch(function(error) {
		next(error);
	});
};

function formatControl(recibida, radio, duracion, horas, minutos) {
	//asimilar que todo el formato es correcto, si al comprobar que uno no lo es, setearlo a false;
	var fechaCorrecta = true;
	var duracionCorrecta = true;
	var radioCorrecta = true;
	var horaCorrecta = true;
	var minutosCorrecta = true;

	//ya que comprobarmos la fecha, no vamos hacer dos veces su calculo, la devolvemos en la funcion
	var fechaInicio = new Date();

	//comprobar minutos
	if ( typeof (parseInt(minutos)) != 'number' || minutos < 0 || minutos > 55 || minutos % 5 != 0) {
		minutosCorrecta = false;
		console.log("error en minutos: " + minutos);
	}
	//comprobar horas
	if ( typeof (parseInt(horas)) != 'number' || horas < 0 || horas > 23) {
		horaCorrecta = false;
		console.log("error en horas: " + horas);
	}
	//comprobar duracion
	if ( typeof (parseInt(duracion)) != 'number' || duracion < 5 || minutos > 60 || minutos % 5 != 0) {
		duracionCorrecta = false;
		console.log("error en duracion: " + duracion);
	}
	//comprobar fecha
	if (recibida.length != 3 || !"number" == typeof (recibida[0]) || !"number" == typeof (recibida[1]) || !"number" == typeof (recibida[2])) {
		fechaCorrecta = false;
		console.log("error en la fecha: " + recibida);
	} else {
		fechaInicio.setFullYear(recibida[2]);
		fechaInicio.setMonth(recibida[1] - 1);
		fechaInicio.setDate(recibida[0]);
		fechaInicio.setHours(horas);
		fechaInicio.setMinutes(minutos);
		fechaInicio.setSeconds(0);

		if (fechaInicio < new Date() || Date.parse(fechaInicio) > Date.parse(new Date()) + 1814400000) {
			fechaCorrecta = false;
			console.log("error en la fecha: " + recibida);
		}
	}
	//comprobar radio
	var radios = ['cadena100', 'ser', 'los40', 'cope', 'europafm', 'ondacero', 'maximafm', 'RNE', 'RNEClass'];
	if (radios.indexOf(radio) < 0) {
		radioCorrecta = false;
		console.log("error en la radio: " + radio);
	}

	//aquí hemos terminado la comprobación
	if (fechaCorrecta && duracionCorrecta && radioCorrecta && horaCorrecta && minutosCorrecta) {
		return fechaInicio;
	} else {
		return undefined;
	}
}

exports.stream = function(req, res, next) {
	var filePath = path.join(__dirname, '/public/audio/' + req.query.fn);
	var stat = fs.statSync(filePath);
	res.writeHead(200, {
		'Content-Type' : 'audio/mp3',
		'Content-Length' : stat.size
	});

	var readStream = fs.createReadStream(filePath);
	// We replaced all the event handlers with a simple call to readStream.pipe()
	readStream.pipe(res);

}

exports.download = function(req, res, next) {
	res.setHeader('Content-disposition', 'attachment; filename=' + req.query.fn);
	res.setHeader('Content-type', 'audio/mp3');

	var file = __dirname + '/public/audio/' + req.query.fn;

	var filename = path.basename(file);
	var mimetype = mime.lookup(file);

	var filestream = fs.createReadStream(file);
	filestream.pipe(res);
}