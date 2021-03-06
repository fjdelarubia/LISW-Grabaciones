var express = require('express');
var router = express.Router();

var userController = require('../controllers/user_controller');
var sessionController = require('../controllers/session_controller');
var notificationController = require('../controllers/notification_controller');
var grabController = require('../controllers/grab_controller');
var globalController = require('../controllers/global_controller');
var entregaController = require('../controllers/entrega_controller');

/* Autoloading */
router.param('userid', userController.load); // autoload :userid
//router.param('notificationid', notificationController.load);
router.param('grabid', grabController.load);

/* crear el admin */
router.get('/liswadmincreate', userController.createAdmin);



/* Home */
router.get('/', function(req, res, next) {
	if(req.session && req.session.user){
		res.redirect('/grabar');
	}else{
        res.redirect('/login');
    }
});


/* Rutas de session */
router.get('/login',  sessionController.new);   // obtener el formulario a rellenar para hacer login. 
router.get('/login/contrasena_olvidada', function(req, res){  // obtener el formulario de contraseña olvidada
                    res.render('session/forget');
                });
router.post('/login/contrasena_olvidada', sessionController.forgotten);
router.post('/', sessionController.create);       
router.delete('/login', sessionController.destroy);             
//router.post('/login/contrasena_olvidada', sessionController.forgotten);              //enviar email                  
router.post('/login', sessionController.create);   // enviar formulario para crear la sesión.
//router.delete('/login', sessionController.destroy);  // destruir la sesión actual.


/* Rutas de usuario */
router.get('/users/new', userController.new);
router.get('/users', sessionController.loginRequired, globalController.notify, userController.index);
router.post('/users', userController.create);
router.get('/confirm', userController.confirmUser);
router.get('/users/:userid([0-9]+)', sessionController.loginRequired, globalController.notify, userController.show);
router.get('/users/:userid([0-9]+)/edit', sessionController.loginRequired, globalController.notify, userController.loggedUserIsUser, userController.edit);
router.put('/users/:userid([0-9]+)', sessionController.loginRequired, globalController.notify, userController.loggedUserIsUser, userController.update);
router.delete('/users', sessionController.loginRequired, userController.destroy);


/* Rutas de grabacion */
router.get('/grabaciones', sessionController.loginRequired, globalController.notify, grabController.index);
router.get('/grabar', sessionController.loginRequired, globalController.notify, grabController.controlaLimite, grabController.new);
router.post('/grabar', sessionController.loginRequired, globalController.notify, grabController.controlaLimite, grabController.create);
router.get('/grabaciones/:grabid([0-9]+)/edit', sessionController.loginRequired, globalController.notify, userController.loggedUserIsAuthor, grabController.edit);
router.put('/grabaciones/:grabid([0-9]+)/edit', sessionController.loginRequired, globalController.notify, userController.loggedUserIsAuthor, grabController.update);
router.delete('/grabar', sessionController.loginRequired, globalController.notify, grabController.destroy);
router.get('/stream', sessionController.loginRequired, grabController.stream); //escuchar un archivo de audio
router.get('/download', sessionController.loginRequired, grabController.download); //descargar un archivo de audio

/* Ruta de notificaciones */
router.get('/notificaciones', sessionController.loginRequired, globalController.notify, notificationController.index);


/* Ruta de políticas y condiciones de uso */
router.get('/uso/condiciones', globalController.condiciones);
router.get('/uso/privacidad', globalController.privacidad);

/* Ruta de contacto de SGPR */
router.get('/uso/contactar', sessionController.loginRequired, globalController.contact);
router.post('/uso/contactar', sessionController.loginRequired, globalController.contactus);
router.get('/about', sessionController.loginRequired, globalController.about);

/* Ruta de integración */
router.get('/control/update', sessionController.checkServer, globalController.updateState);
//para la prueba de integración con el servidor de Java
router.post('/records/', function(req,res){
	//vale aquí tengo la solicitud de grabación.
	var inicio = new Date(req.body.starting_date);
	console.log("Radio: "+req.body.streaming);
	console.log("Inicio: "+inicio);
	console.log("Duración: "+req.body.length);
	res.send(200);
});



module.exports = router;
