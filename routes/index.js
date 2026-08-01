var express = require('express');
var router = express.Router();
const formSchema = require('../models/formSchema')
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');


//حفظ الصور 
const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        cb(null, 'public/uploads');
    },

    filename: function(req, file, cb) {

        const uniqueName =
            Date.now() +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});

const upload = multer({ storage: storage });


/* GET home page. */

router.get('/', auth.isLoggedIn, function(req, res, next) {

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    formSchema.countDocuments()
    .then(totalForms => {

        return formSchema.find()
        .populate('replyBy')
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .then(formData => {

            const totalPages = Math.ceil(totalForms / limit);

            res.render('index', {
                forms: formData,

                currentPage: page,
                totalPages: totalPages,

                hasPrev: page > 1,
                hasNext: page < totalPages,

                prevPage: page - 1,
                nextPage: page + 1,
                currentUser: req.session.user,
                isAdmin: req.session.user.role.roleName === 'Admin'
            });

        });

    })
    .catch(err => {
        console.log(err);
    });

});


router.post('/users/submit-form', upload.single('image'), (req, res, next)=>{

  
  const newForm = new formSchema ({
   
    
    city : req.body.city,
    transactionnumber : req.body.transactionnumber,
    servicecode : req.body.servicecode,
    problemdescription : req.body.problemdescription,
    requiredaction : req.body.requiredaction,
    createdBy: req.session.user._id,
    image: req.file
                ? req.file.filename
                : ''
});


newForm.save()
.then(savedForm=>{
  console.log(savedForm);
  res.status(200).json({success : true,  form: savedForm})
  
})
.catch(err=>{
  console.log(err);
   res.status(500).json({
            success: false,
            message: "حدث خطأ أثناء الحفظ"
        });

})

})


// router update
router.put('/users/update-complaint/:id',  upload.single('image'), (req, res, next) => {

    formSchema.findById(req.params.id)

    .then(form => {

        if (!form) {

            return res.status(404).json({
                success: false,
                message: 'المشكلة غير موجودة'
            });

        }

        // لو فيه رد من الأدمن امنع التعديل
        if (form.adminReply && form.adminReply.trim() !== '') {

            return res.json({
                success: false,
                message: 'لا يمكنك تعديل المشكلة بعد رد المسؤول'
            });

        }


         const updateData = {
            city: req.body.city,
            transactionnumber: req.body.transactionnumber,
            servicecode: req.body.servicecode,
            problemdescription: req.body.problemdescription,
            requiredaction: req.body.requiredaction
        };

        // اختيار صورة جديدة

        if(req.file){
            updateData.image = req.file.filename;
        }

        return formSchema.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

    })

    .then(doc => {

        if (!doc) return;

        res.json({
            success: true,
            message: 'تم التعديل بنجاح'
        });

    })

    .catch(err => {

        console.log(err);

        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء التعديل'
        });

    });

});



// router delete
router.delete('/users/delete-complaint/:id', (req, res, next) => {

    formSchema.findById(req.params.id)

    .then(form => {

        if (!form) {

            return res.status(404).json({
                success: false,
                message: 'المشكلة غير موجودة'
            });

        }

        // لو الأدمن رد، امنع الحذف
        if (form.adminReply && form.adminReply.trim() !== '') {

            return res.json({
                success: false,
                message: 'لا يمكنك حذف المشكلة بعد رد المسؤول'
            });

        }

        return formSchema.findByIdAndDelete(req.params.id);

    })

    .then(doc => {

        if (!doc) return;

        res.json({
            success: true,
            message: 'تم الحذف بنجاح'
        });

    })

    .catch(err => {

        console.log(err);

        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء الحذف'
        });

    });

});


// راوتر حفظ الرد للادمن 

router.put('/users/reply-complaint/:id', auth.isLoggedIn, auth.isAdmin, upload.single('adminAttachment'), (req, res, next) => {

    formSchema.findById(req.params.id)

    .then(form => {

        if (!form) {

            return res.json({
                success: false,
                message: 'الشكوى غير موجودة'
            });

        }

        // حفظ الرد
        form.adminReply = req.body.adminReply;

         if (req.file) {
                form.adminAttachment = req.file.filename;
            }

        form.replyBy = req.session.user._id;

        form.responseperson = req.session.user.username;

        form.replyDate = new Date();

        form.replyStatus = 'Replied';

        form.status = 'تم';

        return form.save();

    })

    .then(() => {

        res.json({
            success: true,
            message: 'تم حفظ الرد'
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

// رواتر البحث 

router.get('/users/search', (req, res, next)=> {

    const transactionnumber = req.query.transactionnumber;

    formSchema.findOne({ transactionnumber: transactionnumber }).populate("replyBy")

    .then(complaint=>{

        if (!complaint) {

            return res.json({

                success: false,

                message: "رقم المعاملة غير موجود"

            });

        }

        res.json({

            success: true,

            complaint: complaint

        });

    })

    .catch(function(err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "حدث خطأ أثناء البحث"

        });

    });

});




module.exports = router;
