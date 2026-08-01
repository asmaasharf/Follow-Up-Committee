var express = require('express')
var router = express.Router()
const auth = require('../middleware/auth')
const technicalNoteSchema = require('../models/technicalNoteSchema')


// راوتر عرض الصفحه
router.get('/', auth.isLoggedIn, (req, res, next)=>{

   const page = parseInt(req.query.page) || 1
    const limit = 10;
    const skip = (page -1)* limit


    technicalNoteSchema.countDocuments()
    .then(totalTechnicalNotes=>{

     technicalNoteSchema.find()
    .populate('createdBy')
    .sort({createdAt : -1})
    .skip(skip)
    .limit(limit)
    .then(notes=>{

        const totalPages = Math.ceil(totalTechnicalNotes / limit)

         res.render('users/technicalNotes', {
            notes, 
            currentUser : req.session.user,
            isAdmin : req.session.user.role.roleName === 'Admin',

            currentPage : page,

            totalPages, 

            hasPrevPage : page > 1,

            hasNextPage : page < totalPages,

            prevPage : page - 1,

            nextPage : page + 1,

         })
    
    })
    .catch(err=>{
        console.log(err);
        next(err)
        
    })

    })
     .catch(err=>{
        console.log(err);
        next(err)
        
    })
    
})


// راوتر حفظ التوضيح 

router.post('/addNotes', auth.isLoggedIn, auth.isAdmin, (req, res, next)=>{

    const note = new technicalNoteSchema({

        serviceCode : req.body.serviceCode ,
        note : req.body.note ,
        createdBy :req.session.user._id ,
    })

    note.save()
    .then(savedNote=>{

        res.json({

            success : true,
           
            isAdmin : true,

            note: {

                _id: savedNote._id,

                serviceCode: savedNote.serviceCode,

                note: savedNote.note,

                createdAt: savedNote.createdAt,

                username: req.session.user.username

            }
        })
    })
    .catch(err=>{
        
        console.log(err);
        
        res.json({
            success : false,
            message : 'حدث خطأ'
        })
    })
})


// راوتر التعديل 

router.put('/editNote/:id', auth.isLoggedIn, auth.isAdmin, (req, res, next) => {

    technicalNoteSchema.findByIdAndUpdate(

        req.params.id,

        {

            serviceCode: req.body.serviceCode,

            note: req.body.note

        },

        { new: true }

    )

    .then(note => {

        if (!note) {

            return res.json({

                success: false,

                message: "التوضيح غير موجود"

            });

        }

        res.json({

            success: true,

            note

        });

    })

    .catch(err => {

        console.log(err);

        res.json({

            success: false,

            message: "حدث خطأ"

        });

    });

});

// راوتر الحذف 

router.delete('/deleteNote/:id', auth.isLoggedIn, auth.isAdmin, (req, res, next) => {

    technicalNoteSchema.findByIdAndUpdate( req.params.id)

    .then(note => {

        if (!note) {

            return res.json({

                success: false,

                message: "التوضيح غير موجود"

            });

        }

        res.json({

            success: true,


        });

    })

    .catch(err => {

        console.log(err);

        res.json({

            success: false,

            message: "حدث خطأ"

        });

    });

});





module.exports=router;