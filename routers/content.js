const markdown = require('markdown').markdown
const Article = require('../editor/models/article')
const User = require('../auth/models/user')

var message = {
    userName: String,
    authorName: String,
    postId: Number,
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
                var parsedContent = markdown.toHTML(content)
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
                res.render('../views/content.pug', { user: user, message: message, html: html })
            } else {
                res.render('../views/404.pug')
            }
        })
    })
    app.get('/usr/:userName',(req,res)=>{
        var userName = req.params.userName
        User.findOne({'local.userName':userName},(err,user)=>{
            if(err){
                throw err
            }
            if(user){
                var curuser = null
                Article.find({'header.authorName':userName},(err,articles)=>{
                    if(err){
                        throw err
                    }
                    if(articles){
                        var idArray = []
                        articles.forEach((article)=>{
                            idArray.push(article.header.articleId)
                        })
                        if(req.isAuthenticated()){
                            curuser = req.user
                            message.userName = curuser.local.userName
                        }
                        res.render('../views/userArticles.pug',{user:curuser,message:message,articles:articles})
                    }
                })
            }else{
                res.render('../views/404.pug')
            }
        })
    })
}