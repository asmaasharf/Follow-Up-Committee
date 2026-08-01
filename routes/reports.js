var express = require('express');
var router = express.Router();
const formSchema = require('../models/formSchema')
const userSchema = require('../models/userSchema')
const auth = require('../middleware/auth');
const { now } = require('mongoose');



//  راوتر التقارير الصفحه الاساسية 

// فانكشن لعدد الصفحات 

function preparePages(data, pageSize = 20) {

    const pages = [];

    for (let i = 0; i < data.length; i += pageSize) {

        pages.push({
            start: i,
            rows: data.slice(i, i + pageSize),
            pageNumber: pages.length + 1
        });

    }

    return pages;
}




router.get('/', auth.isLoggedIn, (req, res, next) => {

    formSchema.find()

    .then((complaints) => {

        const totalComplaints = complaints.length;

        const repliedComplaints = complaints.filter(item => item.status === 'تم').length;

        const notRepliedComplaints = complaints.filter(item => item.status === 'لم يتم').length;

        return userSchema.find({ status: 'Active' })
        .populate('role')

        .then(users=>{

            const admins = users.filter(user=>
                user.role && user.role.roleName === 'Admin'
            )

             res.render('users/reports', {

            complaints ,

            users,

            admins,

             totalComplaints,

             repliedComplaints,

             notRepliedComplaints,

             isAdmin : req.session.user.role.roleName === 'Admin'
        });

        }) 

    })

    .catch((err) => {

        console.log(err);
        next(err);

    });

});


// راوتر تقرير المشاكل المطروحة 

// بيان عدد المشاكل المطروحه
router.get('/view', auth.isLoggedIn, (req, res, next)=>{

    const reportType = req.query.reportType

    if (reportType === 'allComplaints'){
        formSchema.find()
        .populate('replyBy')
        .populate('createdBy')
        .then(complaints=>{
 

            const today = new Date()
            const printDate =
            today.getDate() + "/" +
            (today.getMonth() + 1) + "/" +
            today.getFullYear();

            

            const pages = preparePages(complaints)
            const totalPages = pages.length

             
            res.render('users/report-all-complaints',{
                layout : false,
                 complaints,
                 pages,
                 printDate,
                 totalPages,
                reportTitle: 'بيان عدد المشاكل المطروحة',
                showReplyOfficer: false,
            })
        })
        .catch(err=>{
            console.log(err);
            next(err)
            
        })

    }

// بيان المشاكل التي تم الرد عليها

    else if (reportType === 'repliedComplaints') {

    formSchema.find({ status: 'تم' })
    .populate('replyBy')
    .populate('createdBy')
    
    

    .then((complaints) => {

         const today = new Date()
            const printDate =
            today.getDate() + "/" +
            (today.getMonth() + 1) + "/" +
            today.getFullYear();

        const pages = preparePages(complaints)
        const totalPages = pages.length

        res.render('users/report-all-complaints', {
            
            layout : false,

            complaints,

            pages,

            totalPages,

            printDate,
            
            reportTitle: 'بيان بالمشاكل التي تم الرد عليها',

            showReplyOfficer: true,

        });

    })

    .catch((err) => {

        console.log(err);

        next(err);

    });

}
 
// بيان المشاكل التي لم يتم الرد عليها

else if (reportType === 'notRepliedComplaints') {

    formSchema.find({ status: 'لم يتم' })
    .populate('replyBy')
    .populate('createdBy')

    .then((complaints) => {

         const today = new Date()
            const printDate =
            today.getDate() + "/" +
            (today.getMonth() + 1) + "/" +
            today.getFullYear();

          const pages = preparePages(complaints)  
          const totalPages = pages.length

        res.render('users/report-all-complaints', {

            layout : false,

            complaints,

            pages,

            totalPages,

            printDate,

            reportTitle: 'بيان بالمشاكل التي لم يتم الرد عليها',

            showReplyOfficer: false,

        });

    })

    .catch((err) => {

        console.log(err);

        next(err);

    });

}


// تقرير المستخدمين 
// المستخدمين المعتمدين

else if (reportType === 'activeUsers') {

    userSchema.find({ status: 'Active' })
    .populate('role')
    .populate('approvedBy')

    .then((users) => {

        const today = new Date()
            const printDate =
            today.getDate() + "/" +
            (today.getMonth() + 1) + "/" +
            today.getFullYear();

            

            const pages = preparePages(users)
            const totalPages = pages.length


        res.render('users/userReports', {

            layout : false ,

            pages,

            users,
            reportTitle:'بيان المستخدمين المعتمدين',  
            printDate,
             totalPages,

             showApprovedBy: true,
             showRole: true,



        });

    })

    .catch((err) => {

        console.log(err);

        next(err);

    });

}


// المستخدمين الغير معتمدين 


else if (reportType === 'pendingUsers') {

    userSchema.find({ status: 'Pending' })

    .then((users) => {

        const today = new Date()
        const printDate =
            today.getDate() + "/" +
            (today.getMonth() + 1) + "/" +
            today.getFullYear();

            const pages = preparePages(users)
            const totalPages = pages.length


        res.render('users/userReports', {

            layout : false,

            pages,

            totalPages,

            users,
            reportTitle:'بيان المستخدمين غير المعتمدين',  
            printDate,

            showApprovedBy: false,
            showRole: false,
            showStatus: false,



        });

    })

    .catch((err) => {

        console.log(err);

        next(err);

    });

}

// اعمال مستخدم بالمشاكل التي تم عرضها

else if (reportType === 'userProblems') {

    const createdBy = req.query.userId;

    formSchema.find({ createdBy })
    .populate({
    path: 'createdBy',
    populate: {
        path: 'role'
    }
})

    .then((complaints) => {

        const today = new Date()
        const printDate =
            today.getDate() + "/" +
            (today.getMonth() + 1) + "/" +
            today.getFullYear();

            const pages = preparePages(complaints)
            const totalPages = pages.length


            
        res.render('users/report-all-complaints', {

            layout : false,

            pages, 

            totalPages,

            complaints,

            reportTitle:'بيان اعمال مستخدم بالمشاكل التي تم طرحها',  

            printDate,

            showReplyOfficer: false,

            showReplyStatus : true,


        });

    })

    .catch((err) => {

        console.log(err);

        next(err);

    });

}



//تقرير اعمال اعضاء لجنة المتابعة

else if (

    reportType === 'committeeSolved' ||
    reportType === 'committeeSolvedPeriod' ||
    reportType === 'userApprovalOfficer' || 
    reportType === 'responseOfficer'  


){

    if(req.session.user.role.roleName !== 'Admin'){
        return res.status(403).send('ليس لديك صلاحية للوصول لهذا التقرير')
    }
        
        if (reportType === 'committeeSolved'){


        formSchema.find({status : 'تم'})
        .populate('replyBy')
        .populate('createdBy')

        .then(complaints=>{
        const today = new Date()
        const printDate =
        today.getDate() + '/' +
        (today.getMonth()+1) + '/' +
        today.getFullYear()

        const pages = preparePages(complaints)
        const totalPages = pages.length

        res.render('users/report-all-complaints', {

            layout : false,
            pages,
            totalPages,
            complaints,
             reportTitle: "بيان أعمال عضو لجنة المتابعة التي تم حلها",
            printDate,

            showReplyOfficer: true,

            showReplyStatus: false
        })

    })
    .catch(err=>{
        console.log(err);
        next(err)
        
    })

}

    else if (reportType === "committeeSolvedPeriod") {

    const fromDate = new Date(req.query.fromDate);

    const toDate = new Date(req.query.toDate);

    const fromDateText = req.query.fromDate;
    const toDateText = req.query.toDate;

    toDate.setHours(23, 59, 59, 999);

    const adminId = req.query.adminId;

    formSchema.find({

        status: "تم",

        replyBy: adminId,

        replyDate: {

            $gte: fromDate,

            $lte: toDate

        }

    })

    .populate("replyBy")
    .populate('createdBy')

    .then((complaints) => {

        const today = new Date();

        const printDate =
            today.getDate() + "/" +
            (today.getMonth() + 1) + "/" +
            today.getFullYear();

            const pages = preparePages(complaints)
            const totalPages = pages.length

        res.render("users/report-all-complaints", {

            layout : false,

            pages, 

            totalPages,

            complaints,

            fromDate: fromDateText,

            toDate: toDateText,

            reportTitle: "بيان أعمال عضو لجنة المتابعة التي تم حلها خلال فترة",

            printDate,

            showReplyOfficer: true,

            showReplyStatus: false,

        });

    })

    .catch((err) => {

        console.log(err);

        next(err);

    });

}

else if (reportType === "userApprovalOfficer") {

    const adminId = req.query.adminId;

    const fromDate = new Date(req.query.fromDate);

    const toDate = new Date(req.query.toDate);

    
    const fromDateText = req.query.fromDate;
    const toDateText = req.query.toDate;

    toDate.setHours(23, 59, 59, 999);

    

    userSchema.find({

        status: "Active",

        approvedBy: adminId,

        approvedDate: {

            $gte: fromDate,

            $lte: toDate

        }

    })

    .populate("approvedBy")

    .populate("role")

    .then((users) => {

        const today = new Date();

        const printDate =
            today.getDate() + "/" +
            (today.getMonth() + 1) + "/" +
            today.getFullYear();

            const pages = preparePages(users)
            const totalPages = pages.length

        res.render("users/userReports", {

            layout : false,
            
            pages,

            totalPages,

            users,

            reportTitle: "المسؤول عن اعتماد المستخدمين",

            printDate,

            fromDate : fromDateText,

            toDate : toDateText,

            showStatus : false,

            showRole : true,

            showApprovedBy: true,

        });

    })

    .catch((err) => {

        console.log(err);

        next(err);

    });

}

        }
     



})







module.exports=router