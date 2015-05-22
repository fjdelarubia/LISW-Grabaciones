var models = require('../models');
var mailer = require('nodemailer');
// Middleware: Se requiere hacer login.
//
// Si el usuario ya hizo login anteriormente entonces existira
// el objeto user en req.session, por lo que continuo con los demas
// middlewares o rutas.
// Si no existe req.session.user, entonces es que aun no he hecho
// login, por lo que me redireccionan a una pantalla de login.
// Guardo cual es mi url para volver automaticamente a esa url
// despues de hacer login.
//
exports.loginRequired = function(req, res, next) {
	var fecha = new Date();

	if (req.session.user) {
		if ((sumMinutes(fecha) <= req.session.user.last_activity + 30) || (req.session.user.noclose == 'enabled')) {
			//actualizar la ultima hora de conexion
			req.session.user.last_activity = sumMinutes(fecha);
			next();
		} else {
			req.flash('info', "Se te ha cerrado la session por inactividad");
			delete req.session.user;
			if (req.originalMethod == "GET") {
				res.redirect('/login?redir=' + req.url);
			} else {
				var redir = req.get('referer') || '/';
				res.redirect('/login?redir=' + redir);
			}
		}
	} else {
		req.flash('info', 'Primero tiene que entrar en SGPR');
		if (req.originalMethod == "GET") {
			res.redirect('/login?redir=' + req.url);
		} else {
			var redir = req.get('referer') || '/';
			res.redirect('/login?redir=' + redir);
		}
	}
};

// Formulario para hacer login
//
// Es la tipica ruta REST que devuelve un formulario para crear
// un nuevo recurso.
// Paso como parametro el valor de redir (es una url a la que
// redirigirme despues de hacer login) que me han puesto en la
// query (si no existe uso /).
//
exports.new = function(req, res) {

	res.render('session/new', {
		redir : req.query.redir || '/'
	});
};

//contraseña olvidadad
exports.forgotten = function(req, res, next) {
	var email = req.body.email;
	models.User.find({
		where : {
			email : email
		}
	}).success(function(user) {
		if (user) {
			var nueva = generateRandomPassword();
			var uc = require('../controllers/user_controller');
			user.salt = uc.createNewSalt();
			user.hashed_password = uc.encriptarPassword(nueva, user.salt);
			user.save(['salt', 'hashed_password']).success(function() {
				sendForgottenPassword(user.name, email, nueva);
				req.flash('success', "Se ha enviado un email al correo " + email + " con la nueva contraseña. Entra en tu correo para saberla.");
				res.redirect('/login');
			}).error(function(error) {
				next(error);
			});
		} else {
			req.flash("error", "El email \"" + email + "\" no está registrado, comprueba el email que has introducido y vuelve a intentarlo");
			res.redirect('/login/contrasena_olvidada');
		}
	}).error(function(error) {
		next(error);
	});
};

// Crear la sesion, es decir, hacer el login.
//
// El formulario mostrado por /login usa como action este metodo.
// Cojo los parametros que se han metido en el formulario y hago
// login con ellos, es decir crea la sesion.
// Uso el metodo autenticar exportado por user_controller para
// comprobar los datos introducidos.
// Si la autenticacion falla, me redirijo otra vez al formulario
// de login.
// Notar que el valor de redir lo arrastro siempre.

exports.create = function(req, res, next) {

	var redir = req.body.redir || '/'

	console.log('REDIR = ' + redir);

	var login = req.body.login;
	var password = req.body.password;

	console.log("redireccion: " + redir);

	// console.log('Login    = ' + login);
	// console.log('Password = ' + password);
	var uc = require('./user_controller');
	uc.autenticar(req._remoteAddress, login, password, function(error, user) {

		//ESTO NO PUEDE IR AQUI, SE HAN ENVIADO DATOS YA Y ESTO REDIRIGE ENVIANDO CABECERAS
		if (error) {
			req.flash('error', error.message);
			//res.redirect("/login");
			next();
			return;
		}

		models.User.find({
			where : {
				login : login
			}
		}).success(function(user) {
			if (user.confirmado === 0) {//EL ERROR ESTA AQUI
				//res.redirect('/login');
				req.flash("error", "Usuario no confirmado. Por favor, entra en tu email y confirma tu cuenta.");
				res.render('session/new', {
					redir : req.query.redir || '/'
				});
			} else {
				var fecha = new Date();
				user.ultimaConexion = fecha.getDate() + '/' + (fecha.getMonth() + 1) + '/' + fecha.getFullYear() + ' a las ' + fecha.getHours() + 'h' + fecha.getMinutes() + 'm' + fecha.getSeconds() + 's';
				user.save(['ultimaConexion']).success(function() {
					req.session.user = {
						id : user.id,
						login : user.login,
						name : user.name,
						last_activity : sumMinutes(new Date())
					};
					models.Grab.findAll({
						where : {
							userid : req.session.user.id,
							estado : 0,
							leido : 0
						}
					}).success(function(grabs) {
						req.session.user.notifications = grabs.length;
					}).error(function(error) {
						next(error);
					});
					res.redirect(redir);
				}).error(function(error) {
					next(error);
				});
			}
		}).error(function(error) {
			next(error);
		});
	});
};

// Logout
//
// Para salir de la session simplemente destruyo req.session.user
//

exports.destroy = function(req, res) {
	if (req.session && req.session.user) {
		models.User.find(req.session.user.id).success(function(user) {
			var fecha = new Date();
			user.ultimaDesconexion = fecha.getDate() + '/' + (fecha.getMonth() + 1) + '/' + fecha.getFullYear() + ' a las ' + fecha.getHours() + 'h' + fecha.getMinutes() + 'm' + fecha.getSeconds() + 's';
			user.save(['ultimaDesconexion']).success(function() {
				delete req.session.user;
				req.flash('success', 'Logout.');
				res.redirect("/login");
			}).error(function(error) {
				next(error);
			});
		}).error(function(error) {
			next(error);
		});
	} else {
		req.flash('info', 'ya estás desconectado');
		res.redirect('/login');
	}
};

exports.checkServer = function(req, res, next) {
	var pass = req.query.auth;
	if (!pass || pass != 'sgpRadioLink') {
		res.send(401);
	} else {
		next();
	}
}
function sumMinutes(fecha) {
	var annos = fecha.getFullYear() * 365 * 24 * 60;
	var meses = fecha.getMonth() * 30 * 24 * 60;
	var dias = fecha.getDate() * 24 * 60;
	var horas = fecha.getHours() * 60;
	var minutos = fecha.getMinutes();
	return annos + meses + dias + horas + minutos;
}

exports.onlyAdmin = function(req, res, next) {
	if (req.session.user && req.session.user.login == 'Admin') {
		next();
	} else {
		req.flash("error", "Operación Prohibida");
		res.send(403);
	}
};

function sendForgottenPassword(name, email, password) {
	var transporter = mailer.createTransport({
		service : 'Gmail',
		auth : {
			user : "yassyass22yass@gmail.com",
			pass : 'hemmi2000'
		}
	});
	console.log('SMTP Configured');
	// Message object
	var message = {
		// sender info
		from : 'SGPR Admin <yassyass22yass@gmail.com>',
		// Comma separated list of recipients
		to : '<' + email + '>',
		// Subject of the message
		subject : name + '!, Recupera tu contraseña de SGRP', //
		headers : {
			'X-Laziness-level' : 1000
		},
		// plaintext body
		text : 'Hola ' + name,
		// HTML body
		html : '<p><b>Te envío una contraseña provisional para recuperar tu contraseña de SGRP</b></p>' + '<br><p>Tu nueva contraseña es: <strong>' + password + '</strong><br></p><p>Por favor, después de entrar, cambiarla por una nueva para recordarla mejor</p>' + '<p>Un saludo</p><br><h3>El equipo SGRP</h3>'
	};
	console.log('Sending Mail');
	transporter.sendMail(message, function(error, info) {
		if (error) {
			console.log('Error occurred');
			console.log(error.message);
			return;
		}
		console.log('Message sent successfully to ' + email);
		console.log('Server responded with "%s"', info.response);
	});
};

function generateRandomPassword() {
	var c = ['a', 'A', '7', 'b', 'B', 'c', 'C', 'd', 'D', '4', 'e', 'E', 'f', 'F', '5', 'g', 'G', 'h', 'H', 'i', '8', 'I', 'j', 'J', 'k', '9', 'K', 'l', 'L', 'm', '2', 'M', 'n', 'N', 'o', 'O', 'p', 'P', 'q', '6', 'Q', 'r', 'R', 's', 'S', 't', '3', 'T', 'u', 'U', 'v', 'V', 'w', '1', 'W', 'x', 'X', 'y', 'Y', 'z', 'Z', '0'];
	var password = '';
	var i = 9;
	while (i != 0) {
		var number = Math.round(Math.random() * 100) % 62;
		console.log("numero generado: " + number);
		password += c[number];
		i--;
	}
	console.log("El password generado: " + password);
	return password;
}
