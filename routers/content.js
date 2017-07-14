
const marked = require('marked')
const Article = require('../editor/models/article')
const User = require('../auth/models/user')

var message = {
    userName: String,
    authorName: String,
    postId: Number,
}
marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
})
function storeComment(article, comment, callback) {
    if (!article) {
        throw new ExceptionInformation('No article defined')
    }
    var now = new Date()
    var createTime = now.toUTCString()
    var addModel = {
        time: createTime,
        author: 'Anonmynous',
        content: comment
    }
    article.comments.push(addModel)
    article.save(err => {
        if (err) {
            throw err
        }
        callback(article)
    })

}

var isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/auth/login')
}

module.exports = function (app) {
    //content rendering
    app.get('/content/:id', (req, res) => {
        var id = req.params.id
        Article.findOne({ 'header.articleId': id }, (err, article) => {
            if (err) {
                throw err
            }
            if (article) {
                var title = article.body.title
                var content = article.body.content
                var parsedContent = marked(content)
                message.postId = id
                message.authorName = article.header.authorName
                var html = {
                    title: title,
                    contents: parsedContent
                }
                var user = req.user
                if (req.isAuthenticated()) {
                    message.userName = req.user.local.userName
                } else {
                    message.userName = null
                }
                var comments = []
                if (article.comments.length > 0) {
                    article.comments.forEach((comment) => {
                        comments.push(comment)
                    })
                }
                message.postId = id
                res.render('../views/content.pug', { user: user, message: message, html: html, isContentPage: true, comments: comments })
            } else {
                res.render('../views/404.pug')
            }
        })
    })
    app.get('/usr/:uId', (req, res) => {
        var uId = req.params.uId
        User.findOne({ '_id': uId }, (err, user) => {
            if (err) {
                throw err
            }
            if (user) {
                var curuser = null
                Article.find({ 'header.authorName': user.local.userName }, (err, articles) => {
                    if (err) {
                        throw err
                    }
                    if (articles.length > 0) {
                        message.authorName = user.local.userName
                        var articleArray = []
                        articles.forEach((article) => {
                            articleArray.push({ 'title': article.body.title, 'id': article.header.articleId })
                        })
                        if (req.isAuthenticated()) {
                            curuser = req.user
                            curuser._id = curuser._id.valueOf()
                            message.userName = curuser.local.userName
                        }
                        res.render('../views/userArticles.pug', { user: curuser, message: message, articles: articleArray })
                    } else {
                        message.authorName = user.local.userName
                        var articleArray = []
                        if (req.isAuthenticated()) {
                            curuser = req.user
                            curuser._id = curuser._id.valueOf()
                            message.userName = curuser.local.userName
                        }
                        res.render('../views/userArticles.pug', { user: curuser, message: message, articles: articleArray })

                    }
                })
            } else {
                res.render('../views/404.pug')
            }
        })
    })
    //comment posting
    app.post('/comment/:id', (req, res) => {
        var articleId = req.params.id
        var comment = req.body.comment
        if (comment) {
            Article.findOne({ 'header.articleId': articleId }, (err, article) => {
                if (err) {
                    throw err
                }
                if (article) {
                    storeComment(article, comment, (article) => {
                        res.redirect('/content/' + articleId)
                    })
                } else {
                    res.render('../views/404.pug')
                }
            })
        }
    })
}