var env = require('../env')
if (!env) {
    env = {
        'recaptcha': {
            'siteKey': 'your site key',
            'siteSecret': 'your site secret'
        }
    }
}
const request = require('request')

module.exports = (req, res, next) => {
    var carrierData = {
        'secret': env.recaptcha.siteSecret,
        'response': req.body['g-recaptcha-response']
    }
    request('https://www.google.com/recaptcha/api/siteverify?secret=' + carrierData.secret + '&response=' + carrierData.response, (err, response, body) => {
        if (!err && response.statusCode === 200) {
            var resBody = JSON.parse(body)
            console.log('~~~~~~~~~~~~~')
            console.log(resBody)
            console.log('~~~~~~~~~~~~~')
            if (resBody.success === true) {
                return next()
            } else {
                req.flash('validateMessage', 'Unable to validate your identity')
                res.redirect(req.url)
            }
        }
        else {
            req.flash('validateMessage', 'Identity validation service error')
            res.redirect(req.url)
            console.log(err)
        }
    })
}