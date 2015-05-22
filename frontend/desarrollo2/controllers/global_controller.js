var models = require("../models");
var mailer = require('nodemailer');
var ee = require('../events/index');

exports.loadAssist = function(req,res,next,id){
	models.Assist
	.find(id)
	.then(function(as){
		if(as){
			req.assist = as;
		}else{
			req.flash('error','asistencia no encontrada');
			res.redirect('/gestion/asistencia');
		}
	})
	.catch(function(error){
		next(error);
	});
}

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
		.then(function(grabs){
          req.session.user.notifications = grabs.length;
          next();
		})
		.catch(function(error){
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
		.then(function(grab){
		if(grab){
			if(grab.estado == 2){
				res.send(406);
			}else{
				grab.estado = estado;
				var uid = grab.userid;
				getToken(uid, function(token){
				grab.save(['estado'])
				.then(function(){
					res.send(200);
					if(estado == 2){
					//sendNotificationMail(uid);
						try{
							ee.emit(token, {tipo: 2, cuantas : 1, id : grab.id});
						}catch(ready_exception){
							console.log("Error al notificar al usuario.");
							console.log(ex);
						}
					}else{
						if(estado == 1){
							try{
								ee.emit(token, {tipo: 1, cuantas: 1, id: grab.id})
							}catch(recording_execption){
								console.log("Error al notificar al usuario.");
								console.log(ex);
							}
						}
					}
				})
				.catch(function(error){
					res.send(500);
		    	});
			});
		    }
		}else{
			res.send(404);
		}
	})
	.catch(function(error){
		res.send(500);
	});
	}
}

function getToken(id,callback){
	var token;
	models.User
	.find(id)
	.then(function(user){
		token = user.login+"by"+user.hashed_password;
		callback(token);
	})
	.catch(function(error){
		console.log(error);
	});
};

function sendNotificationMail(uid){
models.User
.find(uid)
.then(function(us){
var transporter = mailer.createTransport({
service: 'Gmail',
auth: {
user: "yassyass22yass@gmail.com",
pass: 'hemmi2000'
}
});
console.log('SMTP Configured');
// Message object
var message = {
// sender info
from: 'SGPR Admin <yassyass22yass@gmail.com>',
// Comma separated list of recipients
to: '<'+us.email+'>',
// Subject of the message
subject: 'Grabación lista', //
headers: {
'X-Laziness-level': 1000
},
// plaintext body
text: us.name+', ',
// HTML body
html: '<p><b>tienes una grabación lista en SGPR!</b></p>' +
'<p>Entra en <a href="'+process.env.FRONTEND_URL+'/notificaciones" _target="blank">SGPR</a> para escucharla en streaming o descargarla directamente desde nuestra página.</p>'+
'<p>Saludos,<p>'+
'<p><b>El equipo SGPR</b></p>'
};
console.log('Sending Mail');
transporter.sendMail(message, function(error, info) {
if (error) {
console.log('Error occurred');
console.log(error.message);
return;
}
console.log('Message sent successfully to yassero_emi@hotmail.fr');
console.log('Server responded with "%s"', info.response);
});
})
.catch(function(error){
	console.log("Ha ocurrido un error al notificar al usuario por email.");
});
};

exports.about = function(req,res,next){
	res.render('about');
};

exports.contact = function(req,res,next){
	res.render('asistencia',{subject: req.query.subject || ''});
};

exports.contactus = function(req,res,next){
	var asistencia = models.Assist.build({
		userid: req.session.user.id,
		asunto: req.body.asunto,
		contenido: req.body.contenido
	});
	// var validates = asistencia.validate();
	// if(validates){
	// 	for(var i in validates){
	// 		req.flash('error',validates[i]);
	// 	}
	// 	res.render('asistencia',{subject: asunto});
	// 	return;
	// }
		asistencia.save()
		.then(function(){
			req.flash('success','Solicitud de asistencia registrada. En breve te enviamos la respuesta a tu email.');
			res.redirect('/grabar');
		})
		.catch(function(error){
			next(error);
		});
};