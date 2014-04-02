'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    rest = require('../others/restware'),
    _ = require('lodash');

/**
 * Create user
 */
exports.create = function (req, res, next) {
    var newUser = new User(req.body);
    newUser.provider = 'local';

    newUser.save(function(err,data) {
        if (err) {
            // Manually provide our own message for 'unique' validation errors, can't do it from schema
            if(err.errors.email.type === 'Value is not unique.') {
                err.errors.email.type = 'The specified email address is already in use.';
            }
            return res.json(400, err);
        }

        req.logIn(newUser, function(err) {
            if (err) return next(err);

            return res.json(req.user.userInfo);
        });
    });
};

/**
 *  Get profile of specified user
 */
exports.show = function (req, res, next) {
    var userId = req.params.id;

    User.findById(userId, function (err, user) {
        if (err) return next(new Error('Failed to load User'));

        if (user) {
            res.send({ profile: user.profile });
        } else {
            res.send(404, 'USER_NOT_FOUND');
        }
    });
};

/**
 * Change password
 */
exports.changePassword = function(req, res, next) {
    var userId = req.user._id;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);

    User.findById(userId, function (err, user) {
        if(user.authenticate(oldPass)) {

            user.password = newPass;
            user.save(function(err) {
                if (err) {
                    res.send(500, err);
                } else {
                    res.send(200);
                }
            });
        } else {
            res.send(400);
        }
    });
};

/**
 * Save details
 */
exports.updateMyRecords = function(req, res, next) {
    var userId = req.user._id;


    User.findById(userId, function (err, user) {
        user = _.extend(user, req.body)
        user.save(function (err,data) {
            if (err)
                return rest.sendError(res,'Unable to update User',err);
            return rest.sendSuccess(res,'updated User details',data);
        });
    });
};

/**
 * Get current user
 */
exports.me = function(req, res) {
    res.json(req.user || null);
};