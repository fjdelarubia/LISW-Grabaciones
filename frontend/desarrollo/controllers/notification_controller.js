var models = require('../models');

var crypto = require('crypto');

exports.index = function(req, res, next) {
    models.Grab
        .findAll({ where: {userid : req.session.user.id , leido: 0, estado: 2}})
        .success(function(grabs) {
        	
        	for(i in grabs) {
        		grabs[i].hash = crypto.createHash('md5').update("" + grabs[i].id).digest('hex');
        	}
        	
            res.render('notificaciones/index', {
                grabs: grabs
            });
        })
        .error(function(error) {
            next(error);
        });
};