const pug = require('pug')
const User = require('../auth/models/user')
const request = require('request')
var env = require('../env')
if (!env) {
    env = {
        'recaptcha': {
            'siteKey': 'your site key',
            'siteSecret': 'your site secret'
        }
    }
}

module.exports = function (app, passport) {
    var message = {
        userName: String,
        authorrName: String,
        postId: Number,
    }

    //index
    app.get('/', (req, res) => {
        var user
        if (req.isAuthenticated()) {
            user = req.user
            message.userName = user.userName
        } else {
            user = null
        }
        User.find({ 'local.privilege': 0 }, (err, userArray) => {
            if (err) {
                throw err
            }
            userArray.forEach((user) => {
                user._id = user._id.valueOf()
            })
            res.render('../views/index.pug', { user: user, message: message, userArray: userArray })
        })

    })
    //post page
    app.get('/post', (req, res) => {

    })

    //local authentication
    app.get('/auth/login', (req, res) => {
        res.render('../views/auth/login.pug', { message: req.flash('loginMessage') })
    })

    app.post('/auth/login', passport.authenticate('local-login', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true
    }))

    //google authorization
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/'
    }))

    //github authorization
    app.get('/auth/github', passport.authenticate('github', { scope: 'email' }))
    app.get('/auth/github/callback', passport.authenticate('github', {
        successRedirect: '/',
        failureRedirect: '/'
    }))

    //local signup
    app.get('/auth/signup', (req, res) => {
        res.render('../views/auth/signup.pug', { message: req.flash('signupMessage') })
    })

    app.post('/auth/signup', validateHuman, passport.authenticate('local-signup', {
        successRedirect: '/',
        failureRedirect: '/auth/signup',
        failureFlash: true
    }))

    //account link
    //local account
    app.get('/connect/local', (req, res) => {
        res.render('../views/auth/connect_local.pug', { message: req.flash('loginMessage') })
    })
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/',
        failureRedirect: '/connect/local',
        failureFlash: true
    }))
    //facebook
    app.get('/connect/facebook', passport.authorize('facebook', { scope: 'email' }))
    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/',
        failureRedirect: '/'
    }))
    //google
    app.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email'] }))
    app.get('/connect/google/callback', passport.authorize('google', {
        successRedirect: '/',
        failureRedirect: '/'
    }))
    //github
    app.get('/connect/github', passport.authorize('github', { scope: 'email' }))
    app.get('/connect/github/callback', passport.authorize('github', {
        successRedirect: '/',
        failureRedirect: '/'
    }))


    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('../views/auth/profile.pug')
    })

    app.get('/auth/logout', (req, res) => {
        req.logout();
        res.redirect('/')
    })
}

var isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/auth/login')
}

function validateHuman(req, res, next) {
    var carrierData = {
        'secret': env.recaptcha.siteSecret,
        'response': req.body['g-recaptcha-response']
    }
    request('https://www.google.com/recaptcha/api/siteverify?secret=' + carrierData.secret + '&response=' + carrierData.response, (err, response, body) => {
        // err= undefined
        // body = {
        //     "success":true,
        //     "challenge_ts":"sometimestamp",
        //     "hostname":"localhost"
        // }
        // body = {
        //     "success": true,
        //     "challenge_ts": "2017-08-14T08:39:30Z",
        //     "hostname": "www.semimajoraxis.com"
        // }

        if (!err && response.statusCode === 200) {
            var resBody = JSON.parse(body)
            console.log('~~~~~~~~~~~~~')
            console.log(resBody)
            console.log('~~~~~~~~~~~~~')
            if (resBody.success === true) {
                return next()
            } else {
                req.flash('signupMessage', 'Unable to validate your identity')
                res.redirect('/auth/signup')
            }
        }
        else {
            req.flash('signupMessage','Identity validation service error')
            res.redirect('/auth/signup')
            console.log(err)
        }
    })
}
