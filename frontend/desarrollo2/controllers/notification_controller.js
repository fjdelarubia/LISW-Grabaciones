var models = require('../models');

exports.index = function(req, res, next) {
    models.Grab
        .findAll({ where: {userid : req.session.user.id , leido: 0, estado: 2}})
        .then(function(grabs) {
            res.render('notificaciones/index', {
                grabs: grabs
            });
        })
        .catch(function(error) {
            next(error);
        });
};