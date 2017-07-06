var passport_local = require('passport-local')
var LocalStrategy = passport_local.Strategy
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var GithubStrategy = require('passport-github').Strategy
var User = require('../models/user')
var Auth = require('./authinfo')
var winston = require('winston')
if (!Auth) {
    Auth = require('./user')
}
winston.add(winston.transports.File,{filename:'../../logs/site.log'})

//save user entity
function storeUser(user = new User(),userName, pwd, callback) {
    user.local.userName = userName
    user.local.privilege = 0
    user.generateHash(pwd, res => {
        user.local.pwd = res
        user.save(err => {
            if (err) {
                throw err
            }
            var now = Date()
            winston.log('register',now.toString()+': registered'+userName)
            callback(err, user)
        })
    })
}
//save google user entity
function storeGoogleUser(user = new User(), profile, token, callback) {
    console.log(profile.emails[0].value)
    user.google.id = profile.id
    user.google.token = token
    user.google.name = profile.displayName
    user.google.email = profile.emails[0].value
    user.save(err => {
        if (err) {
            throw err
        }
        callback(err, user)
    })
}
//save github user entity
function storeGithubUser(user = new User(), profile, token, callback) {
    console.log(profile)
    user.github.id = profile.id
    user.github.token = token
    user.github.nickName = profile.username
    user.save(err => {
        if (err) {
            console.log(err)
            throw err
        }
        callback(err, user)
    })
}

module.exports = function (passport) {
    passport.serializeUser((user, done) => {
        done(null, user.id)
    })
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user)
        })
    })

    //signup strategy
    passport.use('local-signup', new LocalStrategy({
        usernameField: 'userName',
        passwordField: 'pwd',
        passReqToCallback: true
    }, (req, userName, pwd, done) => {
        process.nextTick(function () {
            User.findOne({ 'local.userName': userName }, (err, user) => {
                if (err) {
                    return done(err)
                }
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That user name was already registered'))
                } else {
                    storeUser(undefined, userName, pwd, (err, User) => {
                        return done(err, User)
                    })
                }
            })
        })
    }))

    //login strategy
    passport.use('local-login', new LocalStrategy({
        usernameField: 'userName',
        passwordField: 'pwd',
        passReqToCallback: true
    }, (req, userName, pwd, done) => {
        User.findOne({ 'local.userName': userName }, (err, user) => {
            if (err) {
                return done(err)
            }
            if (!user) {
                return done(null, false, req.flash('loginMessage', 'User not found'))
            }
            user.verifyPassword(pwd, res => {
                if (!res) {
                    return done(null, false, req.flash('loginMessage', 'WrongPassword'))
                }
                return done(null, user);
            })

        })
    }))
    //google strategy
    passport.use(new GoogleStrategy({
        clientID: Auth.googleAuth.clientID,
        clientSecret: Auth.googleAuth.clientSecret,
        callbackURL: Auth.googleAuth.callbackURL,
        passReqToCallback: true
    }, (req, token, refreshToken, profile, done) => {
        process.nextTick(() => {
            if (!req.user) {
                User.findOne({ 'google.id': profile.id }, (err, user) => {
                    if (err) {
                        return done(err)
                    }
                    if (user) {
                        return done(null, user)
                    } else {
                        storeGoogleUser(undefined, profile, token, (err, user) => {
                            return done(null, user)
                        })
                    }
                })
            } else {
                var user = req.user
                storeGoogleUser(user, profile, token, (err, user) => {
                    return done(null, user)
                })
            }
        })
    }
    ))

    //github strategy
    passport.use(new GithubStrategy({
        clientID: Auth.githubAuth.clientID,
        clientSecret: Auth.githubAuth.clientSecret,
        callbackURL: Auth.githubAuth.callbackURL,
        passReqToCallback: true
    }, (req, token, refreshToken, profile, done) => {
        process.nextTick(() => {
            if (!req.user) {
                User.findOne({ 'github.id': profile.id }, (err, user) => {
                    if (err) {
                        console.log(err)
                        return done(err)
                    }
                    if (user) {
                        return done(undefined, user)
                    } else {
                        storeGithubUser(undefined, profile, token, (err, user) => {
                            return done(null, user)
                        })
                    }
                })
            } else {
                var user = req.user
                storeGithubUser(user, profile, token, (err, user) => {
                    return done(null, user)
                })
            }
        })
    }))

}