var models = require("../models");
var mailer = require('nodemailer');
//var ee = require('../events/index');

exports.condiciones = function(req,res,next){
	res.render('condiciones');
}

exports.privacidad = function(req,res,next){
	res.render('privacidad');
}

exports.notify = function(req,res,next){
	if(req.session && req.session.user){
		models.Grab
		.findAll({ where: { userid: req.session.user.id, estado : 2, leido : 0}})
		.success(function(grabs){
          req.session.user.notifications = grabs.length;
          next();
		})
		.error(function(error){
          next(error);
		});
	}
}

/* Prueba de generación del error de servidor 
exports.updateState = function(req,res,next){
	res.send(500);
}

*/

exports.updateState = function(req,res,next){
	var estado = req.query.state;
	var id = req.query.id;
	if(isNaN(estado) || isNaN(id)){
		res.send(400);
	}else{
		models.Grab
		.find(id)
		.success(function(grab){
		if(grab){
			if(grab.estado == 2){
				res.send(406);
			}else{
				grab.estado = estado;
				var uid = grab.userid;
				grab.save(['estado'])
				.success(function(){
					res.send(200);
				})
				.error(function(error){
					res.send(500);
		    	});
		    }
		}else{
			res.send(404);
		}
	})
	.error(function(error){
		res.send(500);
	});
	}
}

exports.about = function(req,res,next){
	res.render('about');
};

exports.contact = function(req,res,next){
	res.render('asistencia');
};

exports.contactus = function(req,res,next){
	var asunto = req.body.asunto;
	var contenido = req.body.contenido;
		var transporter = mailer.createTransport({
			service: 'Gmail',
				auth: {
				user: "yassyass22yass@gmail.com",
				pass: 'hemmi2000'
			}
		});
		// Message object
		var message = {
		// sender info
		from: 'SGPR Admin <yassyass22yass@gmail.com>',
		// Comma separated list of recipients
		to: '<yassero_emi@hotmail.fr>',
		// Subject of the message
		subject: 'Solicitud de asistencia', //
		headers: {
			'X-Laziness-level': 1000
		},
		// plaintext body
		text: '',
		// HTML body
		html: '<p><b>Un usuario solicita ayuda.</b></p>' +
		'<p>Su nombre es : '+req.session.user.name+' y su email es : '+req.session.user.email+'</p>'+
		'<p>Asunto: '+asunto+'<p>'+
		'<p>Contenido: '+contenido+'</p>'
		};

		transporter.sendMail(message, function(error, info) {
			if (error) {
				req.flash('error','No se ha podido enviar tu solicitud de ayuda, inténtalo más tarda. Disculpa las molestias');
				res.redirect('/');
			}else{
				req.flash('success', 'Se ha enviado tu duda. La vamos a tener en cuenta, y te contestaremos cuanto antes.');
				res.redirect('/');
			}
		});
};