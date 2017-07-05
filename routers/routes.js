const pug = require('pug')

module.exports = function (app, passport) {

    app.get('/', (req, res) => {
        var user
        if(req.isAuthenticated()){
            user = req.user
        }else{
            user = null
        }
        res.render('../views/index.pug',{user:user})
    })
    //local authentication
    app.get('/auth/login', (req, res) => {
        res.render('../views/login.pug',{message:req.flash('loginMessage')})
    })

    app.post('/auth/login',passport.authenticate('local-login',{
        successRedirect:'/profile',
        failureRedirect:'/login',
        failureFlash:true
    }))
    
    //google authorization
    app.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
    app.get('/auth/google/callback',passport.authenticate('google',{
        successRedirect:'/profile',
        failureRedirect:'/'
    }))

    //github authorization
    app.get('/auth/github',passport.authenticate('github',{scope:'email'}))
    app.get('/auth/github/callback',passport.authenticate('github',{
        successRedirect:'/profile',
        failureRedirect:'/'
    }))

    //local signup
    app.get('/auth/signup', (req, res) => {
        res.render('../views/signup.pug', { message: req.flash('signupMessage') })
    })

    app.post('/auth/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/auth/signup',
        failureFlash: true
    }))

    //account link
    //local account
    app.get('/connect/local',(req,res)=>{
        res.render('../views/connect_local.pug',{message:req.flash('loginMessage')})
    })
    app.post('/connect/local',passport.authenticate('local-signup',{
        successRedirect:'/profile',
        failureRedirect:'/connect/local',
        failureFlash:true
    }))
    //facebook
    app.get('/connect/facebook',passport.authorize('facebook',{scope:'email'}))
    app.get('/connect/facebool/callback',passport.authorize('facebook',{
        successRedirect:'/profile',
        failureRedirect:'/'
    }))
    //google
    app.get('/connect/google',passport.authorize('google',{scope:['profile','email']}))
    app.get('/connect/google/callback',passport.authorize('google',{
        successRedirect:'/profile',
        failureRedirect:'/'
    }))
    //github
    app.get('/connect/github',passport.authorize('github',{scope:'email'}))
    app.get('/connect/github/callback',passport.authorize('github',{
        successRedirect:'/profile',
        failureRedirect:'/'
    }))


    app.get('/profile', isLoggedIn, (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.write(profile({
            user: req.user
        }))
        res.end()

    })

    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/')
    })




}

var isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/')
}