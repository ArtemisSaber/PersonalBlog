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
                message.postId = id
                res.render('../views/content.pug', { user: user, message: message, html: html,isContentPage:true })
            } else {
                res.render('../views/404.pug')
            }
        })
    })
    app.get('/usr/:uId',(req,res)=>{
        var uId = req.params.uId
        User.findOne({'_id':uId},(err,user)=>{
            if(err){
                throw err
            }
            if(user){
                var curuser = null
                Article.find({'header.authorName':user.local.userName},(err,articles)=>{
                    if(err){
                        throw err
                    }
                    if(articles.length>0){
                        message.authorName = user.local.userName
                        var articleArray = []
                        articles.forEach((article)=>{
                            articleArray.push({'title':article.body.title,'id':article.header.articleId})
                        })
                        if(req.isAuthenticated()){
                            curuser = req.user
                            curuser._id = curuser._id.valueOf()
                            message.userName = curuser.local.userName
                        }
                        res.render('../views/userArticles.pug',{user:curuser,message:message,articles:articleArray})
                    }
                })
            }else{
                res.render('../views/404.pug')
            }
        })
    })
}