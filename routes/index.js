var express = require('express');
var router = express.Router();
const formSchema = require('../models/formSchema')
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const uploadError = require('../middleware/uploadError');


//حفظ الصور 

const fs = require('fs');

const uploadPath = process.env.UPLOAD_PATH || 'public/uploads';

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({

    destination: function(req, file, cb) {

        cb(null, uploadPath);

    },

    filename: function(req, file, cb) {

        const uniqueName =
            Date.now() +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});

function fileFilter(req, file, cb){

    const allowedType = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf'
    ]

    if(allowedType.includes(file.mimetype)){
        cb(null, true)
    }
    else{
        cb(new Error('يسمح فقط برفع ملفات JPG أو PNG أو PDF'), false)
    }
}
const upload = multer({
    storage: storage, 

    limits : {
        fileSize : 5 * 1024 * 1024
    },

    fileFilter : fileFilter
});


/* GET home page. */

router.get('/', auth.isLoggedIn,  auth.isActive, function(req, res, next) {

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


router.post('/users/submit-form', 
    auth.isLoggedIn, 
    auth.isActive, 
    upload.single('image'), 
    uploadError, 
    (req, res, next)=>{

        console.log("UPLOAD PATH:", uploadPath);
console.log("FILE:", req.file);

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
router.put('/users/update-complaint/:id',
    auth.isLoggedIn,
    auth.isActive,
    upload.single('image'),
    uploadError,
    async (req, res, next) => {

        try {

            const form = await formSchema.findById(req.params.id);

            // الشكوى غير موجودة
            if (!form) {

                return res.status(404).json({
                    success: false,
                    message: 'رقم المعاملة غير موجود'
                });

            }


            // منع تعديل الشكوى من مستخدم آخر
            if (
                form.createdBy &&
                form.createdBy.toString() !== req.session.user._id.toString() &&
                req.session.user.role.roleName !== 'Admin'
            ) {

                return res.status(403).json({
                    success: false,
                    message: 'غير مصرح لك بالتعديل'
                });

            }


            // لو فيه رد من الأدمن امنع التعديل
            if (
                form.adminReply &&
                form.adminReply.trim() !== ''
            ) {

                return res.status(403).json({
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


            // لو المستخدم اختار صورة جديدة
            if (req.file) {

                updateData.image = req.file.filename;

            }


            const updatedForm = await formSchema.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );


            if (!updatedForm) {

                return res.status(404).json({
                    success: false,
                    message: 'تعذر تحديث المشكلة'
                });

            }


            return res.json({

                success: true,

                message: 'تم التعديل بنجاح'

            });


        } catch (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: 'حدث خطأ أثناء التعديل'

            });

        }

    }
);


// router delete
router.delete('/users/delete-complaint/:id', auth.isLoggedIn, auth.isActive, (req, res, next) => {

    formSchema.findById(req.params.id)

    .then(form => {

        if (!form) {

            return res.status(404).json({
                success: false,
                message: 'رقم المعاملة غير موجود'
            });

        }

        // منع المستخدم من الحذف اي مشكلة لمستخدم اخر

        if (
            form.createdBy &&
            form.createdBy.toString() !== req.session.user._id.toString() &&
            req.session.user.role.roleName !== "Admin"
            ) {
                return res.status(403).json({
                success: false,
                message: "غير مصرح لك بالحذف"
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

router.put('/users/reply-complaint/:id', auth.isLoggedIn,  auth.isActive, auth.isAdmin, upload.single('adminAttachment'), (req, res, next) => {

    formSchema.findById(req.params.id)

    .then(form => {

        if (!form) {

            return res.json({
                success: false,
                message: 'رقم لمعاملة غير موجود'
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

router.get('/users/search', auth.isLoggedIn, auth.isActive, async (req, res) => {

    try {

        const transactionnumber = req.query.transactionnumber;

        let complaints = await formSchema
            .find({ transactionnumber: transactionnumber })
            .populate("replyBy")
            .sort({ createdAt: 1 });


        // لو مفيش أي شكاوى
        if (!complaints || complaints.length === 0) {

            return res.json({
                success: false,
                message: "رقم المعاملة غير موجود"
            });

        }


        // لو المستخدم مش Admin
        // يظهر له فقط الشكاوى الخاصة به
        if (req.session.user.role.roleName !== "Admin") {

            complaints = complaints.filter(complaint => {

                // لو الشكوى مرتبطة بمستخدم
                if (complaint.createdBy) {

                    return complaint.createdBy.toString() ===
                           req.session.user._id.toString();

                }

                // نحافظ على السلوك القديم للبيانات
                // التي ليس لها createdBy
                return true;

            });

        }


        // بعد الفلترة ممكن ميبقاش فيه نتائج
        if (complaints.length === 0) {

            return res.json({

                success: false,

                message: "غير مصرح لك بعرض هذه الشكاوى"

            });

        }


        res.json({

            success: true,

            complaints: complaints

        });


    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "حدث خطأ أثناء البحث"

        });

    }

});




module.exports = router;
