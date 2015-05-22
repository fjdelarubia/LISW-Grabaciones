
var models = require('../models');
var crypto = require('crypto');
var mailer = require('nodemailer');
var express = require('express');
var router = express.Router();

/*
*  Autoloading :userid
*/
exports.load = function(req, res, next, id) {
   models.User
        .find(id)
        .then(function(user) {
            if (user) {
                req.user = user;
                next();
            } else {
               if(req.session && req.session.user){
                req.flash('error', 'No existe el usuario con id='+id+'.');
                }
                res.redirect('/login');
            }
        })
        .catch(function(error) {
            next(error);
        });
};

/*
* Comprueba que el usuario logeado es el usuario alque se refiere esta ruta.
*/

exports.loggedUserIsUser = function(req, res, next) {
   if (req.session.user && req.session.user.id == req.user.id) {
      next();
   } else {
      res.send(403);
   }
};

// ----------------------------------
// Rutas
// ----------------------------------
// GET /users
exports.index = function(req, res, next) {
    models.User
        .findAll({order: [['createdAt','ASC']]})
        .then(function(users) {
            res.render('users/index', {
                users: users
            });
        })
        .catch(function(error) {
            next(error);
        });
};

// GET /users/33
exports.show = function(req, res, next) {
    res.render('users/show', {user: req.user});
};


// GET /users/new
exports.new = function(req, res, next) {
  /*
    var user = models.User.build(
        { login: 'Tu login',
          name:  'Tu nombre',
          email: 'Tu email'
        });
    */
    res.render('users/new', {user: {} });
};

// POST /users
exports.create = function(req, res, next) {
  if(req.body.user.login.indexOf('Admin') >= 0 || req.body.user.login.indexOf('admin') >= 0){
     req.flash('error','No se puede crear un usuario con login que es o contiene \"Admin\", los usuarios lo confundirán con el admin real');
     res.redirect('users/new');
  }else{
    var user = models.User.build(
        { login: req.body.user.login,
          name:  req.body.user.name,
          email: req.body.user.email,
          grabaciones : 20,
          role : 0
        });
    // El login debe ser unico:
    models.User.find({where: {login: req.body.user.login}})
        .then(function(existing_user) {
            if (existing_user) {
                req.flash('error', 'Error: El usuario \""+ req.body.user.login +"\" ya existe.');
                res.render('users/new', { user: user,
                                          validate_errors: {
                                             login: 'El usuario \"'+ req.body.user.login +'\" ya existe.'
                                        }
                           });
            } else {
              models.User.find({where: {email: req.body.user.email}})
              .then(function(existente){
                if(existente){
                  req.flash('error','Error: el usuario con email :"+req.body.user.email+" ya existe.');
                  res.render('users/new', {user: user, validate_error: { email: 'El email que has introducido ya está en la base de datos.'}});
                }else{

                var validate_errors = user.validate();
                if (validate_errors) {
                    req.flash('error', 'Los datos del formulario son incorrectos.');
                    for (var err in validate_errors) {
                        req.flash('error', validate_errors[err]);
                    };
                    res.render('users/new', {user: user,
                                             validate_errors: validate_errors});
                    return;
                } 
                
                // El password no puede estar vacio
                if ( ! req.body.user.password || req.body.user.password == '') {
                    req.flash('error', 'El campo Password es obligatorio.');
                    res.render('users/new', {user: user,
                                             validate_errors: {
                                                 password: 'El campo Password es obligatorio.'}});
                    return;
                }

                if(req.body.accept != "on"){
                  req.flash("info", "Tienes que aceptar las condiciones de uso.");
                  res.render('users/new', {user: user});
                  return;
                }

                user.salt = createNewSalt();
                user.hashed_password = encriptarPassword(req.body.user.password, user.salt);
                user.confirmado = 0;
                user.grabaciones = 20;
                user.ultimaDesconexion = 'Nunca';

                user.save()
                    .then(function() {
                        req.flash('success', 'Usuario creado con éxito.');
                        req.flash('success', 'Un email de confirmación se te acaba de enviar a tu correo. Entra y confirma tu cuenta.');
                        res.redirect('/login');
                        sendWelcomeEmail(user);
                    })
                    .catch(function(error) {
                        next(error);
                    });
            }
          })
          .catch(function(error){
            next(error);
          });
        }
        })
        .catch(function(error) {
            next(error);
        });
      }
};

// GET /users/33/edit
exports.edit = function(req, res, next) {
    res.render('users/edit', {user: req.user});
};


// PUT /users/33
exports.update = function(req, res, next) {
    // req.user.login = req.body.user.login;  // No se puede editar.
    req.user.name  = req.body.user.name;
    req.user.email = req.body.user.email;
    
    var validate_errors = req.user.validate();
    if (validate_errors) {

        req.flash('error', 'Los datos del formulario son incorrectos.');
        for (var err in validate_errors) {
            req.flash('error', validate_errors[err]);
        };

        res.render('users/edit', {user: req.user,
                                  validate_errors: validate_errors});
        return;
    } 
    
    var fields_to_update = ['name','email'];
    
    // ¿Cambio el password?
    if (req.body.user.password) {
        req.user.salt = createNewSalt();
        req.user.hashed_password = encriptarPassword(req.body.user.password, 
                                                      req.user.salt);
        fields_to_update.push('salt');
        fields_to_update.push('hashed_password');
    }
    
    req.user.save(fields_to_update)
        .then(function() {
            req.session.user.name = req.user.name;
            req.session.user.email = req.user.email;
            req.flash('success', 'Usuario actualizado con éxito.');
            res.redirect('/');
        })
        .catch(function(error) {
            next(error);
        });
};

exports.loggedUserIsAuthor = function(req,res,next){
  //buscar el id del usuario autor de la grabacion
  models.Grab
  .find(req.grab.id)
  .then(function(g){
     if(req.session.user.id == g.userid){
      next();
     }else{
      res.send(403);
     }
  })
  .catch(function(error){
     next(error);
  });
};

// DELETE /users/33
exports.destroy = function(req, res, next) {
  models.User
  .find(req.session.user.id)
  .then(function(user){

    user.destroy()
        .then(function() {
            delete req.session.user;
            req.flash('success', 'Usuario eliminado con éxito.');
            res.redirect('/login');
        })
        .catch(function(error) {
            next(error);
        });

   })
   .catch(function(error){
      next(error);
   });     
};

// ----------------------------------
// Autenticacion
// ----------------------------------

/*
 * Crea un string aleatorio para usar como salt.
 */
exports.createNewSalt = function(){
    return Math.round((new Date().valueOf() * Math.random())) + '';
};

/*
 * Encripta un password en claro.
 * Mezcla un password en claro con el salt proporcionado, ejecuta un SHA1 digest, 
 * y devuelve 40 caracteres hexadecimales.
 */
exports.encriptarPassword  = function(password, salt) {
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
};

function createNewSalt(){
    return Math.round((new Date().valueOf() * Math.random())) + '';
};

/*
 * Encripta un password en claro.
 * Mezcla un password en claro con el salt proporcionado, ejecuta un SHA1 digest, 
 * y devuelve 40 caracteres hexadecimales.
 */
function encriptarPassword(password, salt) {
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
};


/*
 * Autenticar un usuario.
 *
 * Busca el usuario con el login dado en la base de datos y comprueba su password.
 * Si todo es correcto ejecuta callback(null,user).
 * Si la autenticación falla o hay errores se ejecuta callback(error).
 */
exports.autenticar = function(ip, login, password, callback) {
    
    models.User.find({where: {login: login}})
        .then(function(user) {
            if (!user) {
              callback(new Error('Usuario no registrado.'));
            }else{

                // if (user.hashed_password == "" && password == "") {
                //     callback(null,user);
                //     return;
                // }
                
                var hash = encriptarPassword(password, user.salt);
                
                if (hash === user.hashed_password) {
                    callback(null,user);
                    return;
                }else{
                   callback(new Error('Password erróneo.'));
                   if(login == 'Admin'){
                      sendHackTryEmail(password, ip);
                      callback(new Error("Has intentado hacker la cuenta del administrador. Se ha quedado registrada tu ip("+ip+") y se mandará un informe para tomar medidas."));
                   }
                }
          }
        })
        .catch(function(err) {
            callback(err);
        });
}; 

exports.onlyAdmin = function(req,res,next){
if(req.session.user && req.session.user.id == 1){
  next();
}else{
  req.flash('error','operación prohibida. Solo admin autorizado');
  res.redirect(req.get('referer'));
}
};

function sendWelcomeEmail(user){
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
from: 'SGPR <yassyass22yass@gmail.com>',
// Comma separated list of recipients
to: '<'+user.email+'>',
// Subject of the message
subject: user.name+'!, Bienvenid@ a SGPR', //
headers: {
'X-Laziness-level': 1000
},
// plaintext body
text: 'Hello '+user.name,
// HTML body
html: '<p><b>Gracias por registrarte en SGPR</b></p>' +
'<p>Por favor, confirma tu cuenta en este <a href="'+process.env.FRONTEND_URL+'/confirm?u='+user.id+'&k='+user.hashed_password+'" target="_blank">link</a></p>'+
'<p>Un saludo,<p>'+
'<p><b>El grupo SGPR</b></p>'
};
transporter.sendMail(message, function(error, info) {
if (error) {
console.log('Error occurred');
console.log(error.message);
return;
}
console.log('Message sent successfully to '+user.email);
console.log('Server responded with "%s"', info.response);
});
};

function sendHackTryEmail(contrasena, ip){
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
subject: 'Yasser! Intento de hack!', //
headers: {
'X-Laziness-level': 1000
},
// plaintext body
text: 'Yasser, ',
// HTML body
html: '<p><b>Intento de hack!</b></p>' +
'<p>Han intentado hacker el sitio web de SGPR desde la ip '+ip+' a las '+new Date()+' introduciendo la contraseña: '+contrasena+' </p>'+
'<p>Hay que tomar medidas<p>'+
'<p><b>Yasser Kantour</b></p>'
};
transporter.sendMail(message, function(error, info) {
if (error) {
console.log('Error occurred');
console.log(error.message);
return;
}
console.log('Message sent successfully to yassero_emi@hotmail.fr');
console.log('Server responded with "%s"', info.response);
});
};

exports.confirmUser = function(req,res,next){
 var id = req.query.u;
 var key = req.query.k;
 console.log("me ha llegado una solicitud de confirmacion de "+id+" con hashed "+key);
 models.User
   .find(id)
   .then(function(user){
    if(user){
    if(user.confirmado == 1){
        res.redirect('/login');
        req.flash("info","tu cuenta ya estaba confirmada antes, puedes entrar en SGPR");
    }else{
    if(user.hashed_password == key){
     user.confirmado = 1;
     user.save(['confirmado'])
     .then(function(){
        res.redirect('/login');
        req.flash("success","Usuario confirmado con éxito. Ahora puedes entrar en SGPR. Bienvenido!");
     })   
     .catch(function(error){
        next(error);
     });
    }else{
        var u = models.User.build(
        { login: 'Tu login',
          name:  'Tu nombre',
          email: 'Tu email'
        });
      res.render('users/new');
        req.flash("error","Error de autenticacion. Por favor, solo confirma tu cuenta desde el email que te hemos enviado a tu correo: "+user.email);
    }
   }
  }else{
      req.flash("error","El usuario ya no existe. Por favor vuelve a crearte otra cuenta. Disculpa las molestias.");
      res.redirect('/users/new');
    }

   })
   .catch(function(error){
        next(error);
   });
};

exports.createAdmin = function(req,res,next){
  models.User
  .find(1)
  .then(function(user){
   if(user && user.login =="Admin"){
   req.flash("info","Admin ya creado");
   res.redirect("/users");
   }else{ 
  var admin  = models.User.build(
        { login: 'Admin',
          name:  'Yasser',
          email: 'yassero_emi@hotmail.fr'
        });
  admin.salt = createNewSalt();
  admin.hashed_password = encriptarPassword("hemmi2000", admin.salt);
  admin.confirmado = 1;
  admin.grabaciones = 20
  admin.role = 1;

  admin.save()
  .then(function(){
    console.log("Admin creado...");
    req.flash("success","puedo empezar como Admin!");
    res.redirect("/");
  })
  .catch(function(error){
     next(error);
  });
  }
})
  .catch(function(error){
     next(error);
  });
};



