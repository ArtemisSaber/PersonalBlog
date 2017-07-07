const Article = require('../editor/models/article')

function storeArticle(article = new Article(), user, title, content, callback) {
    var now = new Date()
    var createTime = now.toUTCString()
    article.header.createTime = createTime
    var authorName = user.local.userName
    article.header.authorName = authorName
    article.body.title = title
    article.body.content = content
    article.generateHash(authorName, title, content, res => {
        article.header.articleId = res
        article.save(err => {
            if (err) {
                throw err
            }
            callback(article)
        })
    })
}
var isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/auth/login')
}

var message = {
    userName: String,
    authorName: String,
    postId: Number,
}


module.exports = function (app) {
    //editor page
    //new post
    app.get('/editor/new', isLoggedIn, (req, res) => {
        var user = req.user
        message.userName = req.userName
        res.render('../views/editor.pug', { user: user, message: message, article: null })
    })
    //save new post
    app.post('/editor/new', isLoggedIn, (req, res) => {
        var user = req.user
        var title = req.body.title
        var content = req.body.content
        storeArticle(undefined, user, title, content, article => {
            var id = article.header.articleId
            res.redirect('/content/' + id)
        })
    })
    //edit post
    app.get('/editor/:articleId', isLoggedIn, (req, res) => {
        var articleIdParam = req.params.articleId
        var user = req.user
        Article.findOne({ 'header.articleId': articleIdParam }, (err, article) => {
            if (err) {
                throw err
            }
            if (article) {
                if (user.local.userName === article.header.authorName) {
                    message.authorName = article.header.authorName
                    message.postId = article.header.articleId
                    res.render('../views/editor.pug', { user: user, message: message, article: article })
                }
            }else{
                res.render('../views/404.pug')
            }
        })
    })
    //save edit
    app.post('/editor/:articleId', isLoggedIn, (req, res) => {
        var articleIdParam = req.params.articleId
        var user = req.user
        var title = req.body.title
        var content = req.body.content
        Article.findOne({ 'header.articleId': articleIdParam }, (err, article) => {
            if (err) {
                throw err
            }
            if (article) {
                if (user.local.userName === article.header.authorName) {
                    storeArticle(article, user, title, content, article => {
                        var id = article.header.articleId
                        res.redirect('/content/' + id)
                    })
                } else {
                    res.redirect('/')
                }
            } else {
                res.redirect('/')
            }
        })
    })
}