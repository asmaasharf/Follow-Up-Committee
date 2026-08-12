// التحقق من تسجيل الدخول

exports.isLoggedIn = (req, res, next) => {

    if (
        !req.session.isLoggedIn ||

        !req.session.user
    
    ) {

        return res.redirect('/users/signin');

    }

    next();

};


// التحقق من صلاحية الأدمن

exports.isAdmin = (req, res, next) => {

    if (
        !req.session.isLoggedIn ||
        !req.session.user
    
    ) {

        return res.redirect('/users/signin');

    }

    if (!req.session.user.role || req.session.user.role.roleName !== 'Admin') {

        return res.status(403).send('ليس لديك صلاحية للوصول إلى هذه الصفحة');

    }

    next();

};


exports.isActive = (req, res, next)=>{

    if(!req.session.isLoggedIn){
        return res.redirect('/users/signin')
    }

    if(!req.session.user){
        return res.redirect('/users/signin')
    }

    if(req.session.user.status !== 'Active'){
        req.session.destroy(()=>{
            return res.redirect('/users/signin')
        })

        return;
    }

    next()
}