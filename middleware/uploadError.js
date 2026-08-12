module.exports = function (err, req, res, next) {
    console.log("🔥 UPLOAD ERROR:", err);
    console.log("🔥 ERROR MESSAGE:", err.message);
    console.log("🔥 ERROR CODE:", err.code);

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    next();
};