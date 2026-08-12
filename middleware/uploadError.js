

module.exports = function (err, req, res, next){

    if (err){

        console.error("========== UPLOAD ERROR ==========");
        console.error(err);
        console.error("Error message:", err.message);
        console.error("Error code:", err.code);
        console.error("===================================");
        return res.status(400).json({
            success : false,
            message : err.message
        })
    }

    next()

}