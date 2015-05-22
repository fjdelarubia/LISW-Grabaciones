/*
*Lapplication ta3 les notifications à temps réel
*Win tal7a9 conexion jdida, ila raho mlogui, yacréé un écouteur d'evenment oui el isem ta3 l'évenement houwa el lohin ta3 l'utilisateur 
*L'evenement yaba3tou el controlleur ta3 les enregistrement w hada ycaptih w yab3at une notification b l'evenement li yab3atlou lakhor
*/
var ee = require('../events/index');
var models = require('../models');

exports.connection = function(socket){
		ee.on(socket.handshake.query.token, function(notificaciones){
			socket.emit('notificar', {tipo: notificaciones.tipo, cuantas: notificaciones.cuantas, id : notificaciones.id});
		});
}

exports.authorize = function(handshake, callback){
	var token = handshake._query.token.split("by");

	 if(token.length != 2){
	 	callback('Authorization required',false);
	 }else{
	 	models.User
	 	.find({where: {login: token[0]}})
	 	.then(function(user){
	 		if(user.hashed_password == token[1]){
	 			//autenticado con éxito!
	 			callback(null,true);
	 		}else{
	 			callback('Authorization failed',false);
	 		}
	 	})
	 	.catch(function(error){
	 		callback(error,false);
	 	});
	 }
}

