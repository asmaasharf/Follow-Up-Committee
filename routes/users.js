var express = require('express');
var router = express.Router();
const {check, validationResult} = require('express-validator')
const User = require('../models/userSchema')
const bcrypt = require('bcrypt')

const Role = require('../models/roleSchema');
const auth = require('../middleware/auth');





// راوتر ال roles الخاص ب مجموعات العمل 

router.get('/create-roles', (req, res, next) => {

    const roles = [
        { roleName: 'Admin' },
        { roleName: 'Manager' },
        { roleName: 'User' }
    ];

    Role.insertMany(roles, { ordered: false })

        .then(result => {

            console.log(result);

            res.send('Roles Created Successfully');

        })

        .catch(err => {

            // لو الـ Roles موجودة بالفعل هيطلع Duplicate Key Error
            if (err.code === 11000 || err.writeErrors) {

                return res.send('Roles Already Exist');

            }

            console.log(err);

            res.status(500).send('Error Creating Roles');

        });

});


/* GET users listing. */

//[router sign up]
router.get('/signup', function(req, res, next) {
  res.render('users/signup');
});

router.post('/signup',[

check('city')
.notEmpty().withMessage('اختار المركز والمدينة'),

check('fullName')
.notEmpty().withMessage('الاسم بالكامل مطلوب'),

check('nationalId')
.notEmpty().withMessage('الرقم القومي مطلوب')
.isLength({ min: 14, max: 14 })
.withMessage('الرقم القومي يجب أن يكون 14 رقمًا'),

check('phone')
.notEmpty().withMessage('رقم الهاتف مطلوب'),
// .isLength({min: 11, max: 11}),

check('jobTitle')
.notEmpty()
.withMessage('يرجى اختيار الوظيفة'),

check('username')
.notEmpty().withMessage('اسم المستخدم مطلوب')
.isLength({min : 2}).withMessage('يجب الا يقل اسم المستخدم عن حرفين'),

check('password')
.notEmpty().withMessage('كلمة المرور مطلوبة')
.isLength({min : 5}).withMessage('يجب الا تقل كلمة المرور عن خمسة احرف او ارقام'),

check('confirm-password')
.custom((value, {req})=>{
    if ( value !== req.body.password){
        throw new Error('كلمتاالمرور غير متطابقين')
    }
    return true ;
    })

], (req, res, next)=>{



const errors = validationResult(req);


if (!errors.isEmpty()) {
    const validationMessages = [];
    errors.array().forEach(error => {
        validationMessages.push(error.msg);

    }); 
    
    return res.render('users/signup', {
      validationMessages : validationMessages,
      hasErrors : true,
      oldInput : req.body
    })
}


User.findOne({ nationalId: req.body.nationalId })

.then(user => {

    if (user) {

            return res.render('users/signup', {

                validationMessages: ['الرقم القومي مسجل بالفعل'],

                hasErrors: true,

                oldInput: req.body

            });


        }
// البحث عن اسم المستخدم داخل نفس المركز

       return User.findOne({
            username : req.body.username,
            city : req.body.city,
        })
    })

    .then(user=>{

        if (user){

            return res.render('users/signup', {

                validationMessages: ['اسم المستخدم موجود بالفعل داخل المركز'],

                hasErrors: true,

                oldInput: req.body

            });

        }
   

    const newUser = new User({

        city: req.body.city,

        fullName: req.body.fullName,

        nationalId: req.body.nationalId,

        phone: req.body.phone,

        jobTitle: req.body.jobTitle,

        username: req.body.username,

        password: new User().hashPassword(req.body.password)

    });

    return newUser.save();

})

.then(result => {

    if (!result){
        return ;
    }

   return res.redirect('signin');

})

.catch(err => {

    console.log(err);

    if (res.headersSent){
        return;
    }

    res.render('users/signup', {

        validationMessages: ['حدث خطأ أثناء إنشاء الحساب'],

        hasErrors: true,

        oldInput: req.body

    });

});

})


//[router sign in]

router.get('/signin', function(req, res, next) {
  res.render('users/signin');
});


router.post('/signin', [

  check('city')
    .notEmpty().withMessage('اختار المركز والمدينة'),

  check('username')
    .notEmpty().withMessage('اسم المستخدم مطلوب'),

  check('password')
    .notEmpty().withMessage('كلمة المرور مطلوبة')

], (req, res, next) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {

    const validationMessages = [];

    errors.array().forEach(error => {
      validationMessages.push(error.msg);
    });

    return res.render('users/signin', {
      validationMessages: validationMessages,
      hasErrors: true,
      oldInput: req.body
    });

  }

  // البحث عن المستخدم بالمركز + اسم المستخدم
  User.findOne({
    username: req.body.username,
    // city: req.body.city
  })

  .populate('role')

  .then(user => {

    // المستخدم غير موجود
    if (!user) {

      return res.render('users/signin', {
        validationMessages: [
          'خطأ في المركز أو اسم المستخدم أو كلمة المرور'
        ],
        hasErrors: true,
        oldInput: req.body
      });

    }

    // التحقق من كلمة المرور
    return bcrypt.compare(req.body.password, user.password)

    .then(doMatch => {

      // كلمة المرور غلط
      if (!doMatch) {

        return res.render('users/signin', {
          validationMessages: [
            'خطأ في المركز أو اسم المستخدم أو كلمة المرور'
          ],
          hasErrors: true,
          oldInput: req.body
        });

      }

      // الحساب Pending
      if (user.status === 'Pending') {

        return res.render('users/signin', {
          validationMessages: [
            'حسابك قيد المراجعة، يرجى انتظار موافقة المسؤول'
          ],
          hasErrors: true,
          oldInput: req.body
        });

      }

      // الحساب Rejected
      if (user.status === 'Rejected') {

        return res.render('users/signin', {
          validationMessages: [
            'تم رفض طلب إنشاء الحساب، يرجى التواصل مع المسؤول'
          ],
          hasErrors: true,
          oldInput: req.body
        });

      }

      // الحساب Inactive
      if (user.status === 'Inactive') {

        return res.render('users/signin', {
          validationMessages: [
            'هذا الحساب موقوف، يرجى التواصل مع المسؤول'
          ],
          hasErrors: true,
          oldInput: req.body
        });

      }

      // الحساب Active
      req.session.isLoggedIn = true;

      req.session.user = user;

      return req.session.save(err => {

        if (err) {

          console.log(err);

          return res.status(500).send(
            'حدث خطأ أثناء تسجيل الدخول'
          );

        }

        return res.redirect('/');

      });

    });

  })

  .catch(err => {

    console.log(err);

    if (res.headersSent) {
      return;
    }

    res.status(500).send(
      'حدث خطأ أثناء تسجيل الدخول'
    );

  });

});    



// صفحة ادارة المستخدمين 

// صفحة إدارة المستخدمين

router.get('/manage-users',
    auth.isLoggedIn,
    auth.isActive,
    auth.isAdmin,
    (req, res, next) => {

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        Role.find()

        .then(roles => {

            return User.find({ status: 'Pending' })
                .populate('role')
                .sort({ createdAt: -1 })

            .then(pendingUsers => {

                return User.countDocuments({
                    status: { $in: ['Active', 'Inactive'] }
                })

                .then(totalUsers => {

                    return User.countDocuments({
                        status: 'Active'
                    })

                    .then(activeCount => {

                        return User.countDocuments({
                            status: 'Inactive'
                        })

                        .then(inactiveCount => {

                            return User.find({
                                status: { $in: ['Active', 'Inactive'] }
                            })
                            .populate('role')
                            .sort({ createdAt: -1 })
                            .skip(skip)
                            .limit(limit)

                            .then(approvedUsers => {

                                const totalPages =
                                    Math.ceil(totalUsers / limit);

                                return res.render(
                                    'users/manageUsers',
                                    {
                                        roles,
                                        pendingUsers,
                                        approvedUsers,
                                        activeCount,
                                        inactiveCount,

                                        currentUser:
                                            req.session.user,

                                        currentPage: page,
                                        totalPages,

                                        hasPrevPage: page > 1,

                                        hasNextPage:
                                            page < totalPages,

                                        prevPage: page - 1,
                                        nextPage: page + 1
                                    }
                                );

                            });

                        });

                    });

                });

            });

        })

        .catch(err => {

            console.log(err);
            next(err);

        });

    }
);


// اعتماد مستخدم

router.put('/approve-user/:id',
    auth.isLoggedIn,
    auth.isActive,
    auth.isAdmin,
     (req, res, next) => {

    User.findByIdAndUpdate(

        req.params.id,

        {
            role: req.body.role,
            status: 'Active',
            approvedBy: req.session.user._id,
            approvedDate: new Date()
        },

        { new: true }

    )

    .then(user => {

        if (!user) {

            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });

        }

        return res.json({
            success: true,
            message: 'تم اعتماد المستخدم'
        });

    })

    .catch(err => {

        console.log(err);

        res.status(500).json({
            success: false,
             message: 'حدث خطأ أثناء اعتماد المستخدم'

        });

    });

});


// رفض مستخدم

router.put('/reject-user/:id',
    auth.isLoggedIn,
    auth.isActive,
    auth.isAdmin,
    (req, res, next) => {

    User.findByIdAndUpdate(

        req.params.id,

        {
            status: 'Rejected'
        },

        { new: true }

    )

    .then(user => {

        if (!user) {

            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });

        }

        return res.json({
            success: true,
            message: 'تم رفض طلب إنشاء الحساب'
        });

    })

    .catch(err => {

        console.log(err);

        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء رفض المستخدم'
        });

    });

});

// تسجيل خروج


router.get('/logout',
    auth.isLoggedIn,
    (req, res, next) => {

    req.session.destroy(err => {

        if (err) {

            console.log(err);

            return res.redirect('/');

        }

        return res.redirect('/users/signin');

    });

});


// راوتر تغيير ال role

router.put('/change-role',
    auth.isLoggedIn,
    auth.isActive,
    auth.isAdmin,
    (req, res) => {

    const { userId, roleId } = req.body;

      // منع الأدمن من تغيير مجموعة العمل الخاصة به
    if (userId == req.session.user._id) {

        return res.status(403).json({

            success: false,

            message: 'لا يمكنك تغيير مجموعة العمل الخاصة بك'

        });

    }

    User.findByIdAndUpdate(

        userId,

        { role: roleId },

        { new: true }

    )

    .then(updatedUser => {


        if (!updatedUser) {

                return res.status(404).json({
                    success: false,
                    message: 'المستخدم غير موجود'
                });
         }

       return res.json({

            success: true,

            message: 'تم تغيير مجموعة العمل بنجاح'

        });

    })

    .catch(err => {

        console.log(err);

       return res.status(500).json({

            success: false,

            message: 'حدث خطأ'

        });

    });

});

// راوتر ايقاف او تفعيل الحساب

router.put('/toggle-status',
    auth.isLoggedIn,
    auth.isActive,
    auth.isAdmin,
    (req, res) => {

    const { userId, currentStatus } = req.body;

    // منع الأدمن من إيقاف حسابه
    if (userId == req.session.user._id) {

        return res.status(403).json({

            success: false,

            message: 'لا يمكنك إيقاف حسابك'

        });

    }

    const newStatus = currentStatus === 'Active'
        ? 'Inactive'
        : 'Active';

    User.findByIdAndUpdate(

        userId,

        { status: newStatus },

        { new: true }

    )

    .then(updatedUser => {

         if (!updatedUser) {

                return res.status(404).json({
                    success: false,
                    message: 'المستخدم غير موجود'
                });

            }

       return res.json({

            success: true,

            message: newStatus === 'Inactive'
                ? 'تم إيقاف الحساب بنجاح'
                : 'تم تفعيل الحساب بنجاح'

        });

    })

    .catch(err => {

        console.log(err);

        res.status(500).json({

            success: false,

            message: 'حدث خطأ'

        });

    });

});


// تغيير كلمة المرور 

router.get('/change-password', auth.isLoggedIn, auth.isActive, (req, res, next)=>{
    res.render('users/changePassword')
})

router.post('/change-password' ,
    auth.isLoggedIn,
    auth.isActive,
    async(req, res, next)=>{

    try{

        const {currentPassword, newPassword, confirmPassword} = req.body;

        if(newPassword !== confirmPassword){

             return res.send('كلمتا المرور غير متطابقتين')

        }

        const user = await User.findById(req.session.user._id)

        const match = await bcrypt.compare(
            currentPassword, 
            user.password
        )

        if (!match){
            return res.send('كلمة المرور الحالية غير صحيحة')
        }

        user.password = await bcrypt.hash(newPassword, 10)
        console.log(user);

        await user.save()

        

        res.redirect('/users/signin')
        

    }
    catch(err){
        console.log(err);
        res.send('حدث خطأ')
        
    }
})





module.exports = router;
