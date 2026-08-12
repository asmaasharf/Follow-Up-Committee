

module.exports = function (err, req, res, next){

    if (err){
        
        return res.status(400).json({
            success : false,
            message : err.message
        })
    }

    next()

}