var express = require('express');
var router = express.Router();
const User = require('../models/userSchema')
const Role = require('../models/roleSchema');
const auth = require('../middleware/auth');
const inquirySchema = require('../models/inquirySchema')

// راوتر الاستفسارات 

router.get('/', auth.isLoggedIn, auth.isActive, (req, res, next) => {

    const page = parseInt(req.query.page) || 1
    const limit = 10;
    const skip = (page -1)* limit

    inquirySchema.countDocuments()
    .then(totalInquiries =>{

        
        inquirySchema.find()

    .populate('createdBy')

    .populate('replyBy')

    .sort({ createdAt: -1 })
    
    .skip(skip)

    .limit(limit)

    .then(inquiries => {

        const totalPages = Math.ceil(totalInquiries / limit)

        res.render('users/inquiries', {

            inquiries,

            currentUser : req.session.user,

            isAdmin: req.session.user.role.roleName === 'Admin',

            currentPage : page,

            totalPages,

            hasPrevPage : page > 1,

            hasNextPage : page < totalPages,

            prevPage : page - 1 ,

            nextPage : page + 1,

        });

    })

    .catch(err => {

        console.log(err);

        next(err);

    });

    })
    .catch(err => {

        console.log(err);

        next(err);

    });


});


// راوتر حفظ الاستفسارات 

router.post('/addInquiry', auth.isLoggedIn, auth.isActive, (req, res, next) => {

    const inquiry = new inquirySchema({

        inquiry: req.body.inquiry,

        createdBy: req.session.user._id

    });

    inquiry.save()

    .then(savedInquiry => {

        res.json({

            success: true,

             isAdmin: req.session.user.role.roleName === "Admin",

            inquiry: {

                _id: savedInquiry._id,

                city: req.session.user.city,

                username: req.session.user.username,

                jobTitle: req.session.user.jobTitle,

                inquiry: savedInquiry.inquiry,

                createdAt: savedInquiry.createdAt

            }

        });

    })

    .catch(err => {

        console.log(err);

        res.json({

            success: false,

            message: 'حدث خطأ'

        });

    });

});

 

// راوتر التعد يل الخاص برد الادمن ع الاستفسار 

router.put('/replyInquiry/:id',
     auth.isLoggedIn,
      auth.isActive, 
       auth.isAdmin, 
       (req, res, next) => {

    inquirySchema.findByIdAndUpdate(

        req.params.id,

        {

            reply: req.body.reply,

            replyBy: req.session.user._id,

            replyDate: new Date(),

            status: "Answered",

            

        },

        { new: true }

    )

    .populate('replyBy')

    .then(inquiry => {

        if (!inquiry) {

            return res.json({

                success: false,

                message: 'الاستفسار غير موجود'

            });

        }

        res.json({

            success: true,

            reply: inquiry.reply,

            replyBy: inquiry.replyBy.username,

            replyDate: inquiry.replyDate

        });

    })

    .catch(err => {

        console.log(err);

        res.json({

            success: false,

            message: 'حدث خطأ'

        });

    });

});


// راوتر التعديل الخاص باليوزر 

router.put('/updateInquiry/:id', auth.isLoggedIn, auth.isActive, (req, res, next) => {

    inquirySchema.findById(req.params.id)

    .then(inquiry => {

        if (!inquiry) {

          return  res.json({
                success: false,
                message: 'الاستفسار غير موجود'
            });

            
        }

        // السماح لصاحب الاستفسار فقط
        if (inquiry.createdBy.toString() !== req.session.user._id.toString()) {

               res.json({
                success: false,
                message: 'غير مصرح لك بالتعديل'
            });
             
            return null;
           
        }

        // يمنع التعديل بعد رد الأدمن
        if (inquiry.replyBy) {

            res.json({
                success: false,
                message: 'لا يمكنك تعديل الاستفسار بعد الرد عليه'
            });

            return null;
        }

        return inquirySchema.findByIdAndUpdate(
            req.params.id,
            {
                inquiry: req.body.inquiry
            },
            { new: true }
        );

    })

    .then(updatedInquiry => {

    if (updatedInquiry === null) {
    return;
    }

    if (!updatedInquiry) {

        return res.json({
            success: false,
            message: 'فشل تعديل الاستفسار'
        });

        

    }

    res.json({
        success: true,
        updatedInquiry,
        message: 'تم التعديل بنجاح'
    });

})

    .catch(err => {

        console.log(err);

        res.json({
            success: false,
            message: 'حدث خطأ'
        });

    });

});


// راوتر الحذف الخاص باليوزر 

router.delete('/deleteInquiry/:id', auth.isLoggedIn, auth.isActive, async (req, res) => {

    try {

        const inquiry = await inquirySchema.findById(req.params.id);

        if (!inquiry) {
            return res.json({ success: false, message: 'الاستفسار غير موجود' });
        }

        if (inquiry.createdBy.toString() !== req.session.user._id.toString()) {
            return res.json({ success: false, message: 'غير مصرح لك بحذف الاستفسار' });
        }

        if (inquiry.replyBy) {
            return res.json({ success: false, message: 'لا يمكنك حذف الاستفسار بعد رد المسؤول عليه' });
        }

        await inquirySchema.findByIdAndDelete(req.params.id);

        return res.json({
            success: true,
            message: 'تم حذف الاستفسار بنجاح'
        });

    } catch (err) {

        console.log(err);

        return res.json({
            success: false,
            message: 'حدث خطأ'
        });

    }

});



module.exports = router;