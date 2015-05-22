var models = require('../models');
var uc = require('../controllers/user_controller');

exports.manageUsers = function(req,res,next){
	//ofrecerá servicio para ver todos los usuarios y gestionarlos, y de buscar a un usuario por su id, login, nombre o email
	var index = req.query.index || 1;
	if(index < 1){index = 1;}
	var p = (index-1)*10;

	models.User
	.count()
	.then(function(n){
		var np = Math.ceil(n/10);
		if(index > np){index = np;p = (index-1)*10;}
		models.User
		.findAll({offset: p, limit: 10})
		.then(function(users){
			res.render('gestion/usuarios/index',{users: users, index: index, pages: np});
		})
		.catch(function(error){
			next(error);
		});	
	})
	.catch(function(error){
		next(error);
	})
			
};

exports.manageGrabs = function(req,res,next){
	//ofrecerá servicio para ver todas las grabaciones y gestionarlas
	var index = req.query.index || 1;
	if(index < 1){index = 1;}
	var p = (index-1)*10;

	models.Grab
	.count()
	.then(function(n){
		var np = Math.ceil(n/10);
		if(index > np){index = np;p = (index-1)*10;}
		models.Grab
		.findAll({offset: p, limit: 10})
		.then(function(grabs){
			res.render('gestion/grabaciones/index',{grabs: grabs, index: index, pages: np});
		})
		.catch(function(error){
			next(error);
		});	
	})
	.catch(function(error){
		next(error);
	})
};

exports.deleteUser = function(req,res,next){
	models.User
	.find(req.user.id)
	.then(function(user){
		user.destroy()
			.then(function(){
				req.flash('success',"Borrado con éxito!");
				res.redirect('/gestion/usuarios');
			})
			.catch(function(error){
				next(error);
			})
	})
	.catch(function(error){
		next(error);
	});
};

exports.updateUser = function(req,res,next){
	var salt = uc.createNewSalt();
	models.User
	.find(req.body.iduser)
	.then(function(usuario){
		if(usuario){
		var campos = ['role','login','name','email','ultimaConexion','grabaciones','confirmado'];
		if(req.body.password != "" && ! 'undefined' == typeof(req.body.password)){
			campos.push('salt');
			campos.push('hashed_password');
		}

		usuario.role= req.body.rol;
		usuario.login= req.body.login;
		usuario.name= req.body.name;
		usuario.email= req.body.email;
		usuario.ultimaConexion= req.body.ucon;
		usuario.grabaciones= req.body.grabaciones;
		usuario.confirmado= req.body.confirmado;
		usuario.salt= salt;
		usuario.hashed_password= uc.encriptarPassword(req.body.password,salt);

		var v = usuario.validate();
		if(v){
			for(err in v){
				req.flash('error',v[err]);
			}
			res.redirect('/gestion/usuarios');
		}

		usuario.save(campos)
		.then(function(){
			req.flash('success','Usuario actualizado con éxito!');
			res.redirect('/gestion/usuarios');
		})
		.catch(function(error){
			req.flash('error','Error al actualizar el usuario');
			next(error);
		})
		}else{
			req.flash('error','Usuario no encontrado');
			res.redirect('/gestion/usuarios');
		}
	})
	.catch(function(error){
		req.flash('error','Error al buscar el usuario en la base de datos.')
		next(error);
	});


};

exports.showUser = function(req,res,next){
	models.User
	.find(req.user.id)
	.then(function(user){
		res.render('gestion/usuarios/show',{user: user});
	})
	.catch(function(error){
		next(error);
	});
};

exports.deleteGrab = function(req,res,next){
	models.Grab
	.find(req.grab.id)
	.then(function(grab){
		grab.destroy()
			.then(function(){
				req.flash('success',"Grabación borrada con éxito!");
				res.redirect('/gestion/grabaciones');
			})
			.catch(function(error){
				next(error);
			})
	})
	.catch(function(error){
		next(error);
	});

};
exports.updateGrab = function(req,res,next){
	models.Grab
	.find(req.body.idgrab)
	.then(function(grab){
		if(grab){

		grab.radio= req.body.radio;
		grab.inicio= req.body.inicio;
		grab.estado= req.body.estado;
		grab.leido= req.body.leido;
		grab.email= req.body.email;
		grab.userid= req.body.userid;
		grab.duracion= req.body.duracion;

		var v = grab.validate();
		if(v){
			for(err in v){
				req.flash('error',v[err]);
			}
			res.redirect('/gestion/grabaciones');
		}

		grab.save()
		.then(function(){
			req.flash('success','Grabación actualizada con éxito!');
			res.redirect('/gestion/grabaciones');
		})
		.catch(function(error){
			req.flash('error','Error al actualizar la grabación');
			next(error);
		})
		}else{
			req.flash('error','Grabación no encontrada');
			res.redirect('/gestion/grabaciones');
		}
	})
	.catch(function(error){
		req.flash('error','Error al buscar la grabación en la base de datos.')
		next(error);
	});


};

exports.showGrab = function(req,res,next){
	models.Grab
	.find(req.grab.id)
	.then(function(grab){
		res.render('gestion/grabaciones/show',{grab: grab});
	})
	.catch(function(error){
		next(error);
	});
};

exports.manageAssists = function(req,res,next){
	//ofrecerá servicio para ver todas las grabaciones y gestionarlas
	var index = req.query.index || 1;
	if(index < 1){index = 1;}
	var p = (index-1)*10;

	models.Assist
	.count()
	.then(function(n){
		var np = Math.ceil(n/10);
		if(index > np){index = np;p = (index-1)*10;}
		models.Assist
		.findAll({offset: p, limit: 10})
		.then(function(asists){
			res.render('gestion/asistencias/index',{asists: asists, index: index, pages: np});
		})
		.catch(function(error){
			next(error);
		});	
	})
	.catch(function(error){
		next(error);
	})
}

exports.showAssist = function(req,res,next){
	next(new Error("Estas en show asistencia"));
}

exports.deleteAssist = function(req,res,next){
	next(new Error("Estas en borrar asistencia"));
}