var url = process.env.DB || 'localhost'
module.exports = {
    url:'mongodb://'+url+'/blog'
}