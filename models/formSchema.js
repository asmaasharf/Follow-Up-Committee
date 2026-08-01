const mongoose = require('mongoose')
const formSchema = mongoose.Schema({
    city : {
        type : String,
        required : true
    }, 
    transactionnumber : {
        type : String,
        required : true,
    },
    servicecode : {
        type : String,
        required : true,
    
    },
    problemdescription : {
        type : String,
        required : true,
    },
    requiredaction : {
        type : String,
        required : true,
    },
    
    image: {
    type: String,
    default: ''
    },
//  رفع صورة او ملف للادمن 
    adminAttachment: {
    type: String,
    default: ""
},
    
responseperson: {
    type: String,
    default: 'لم يتم'
},

    status : {
        type : String,
        enum : ['تم' , 'لم يتم'],
        default : 'لم يتم'
    },

    adminReply: {
    type: String,
    default: ''
    },

    replyBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    },

   createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    //required: true  هيتم تفعيلها بعد نهاية المشروع بعد ما امسح قاعدة البيانات ال موجودة 
},

    replyDate: {
    type: Date
    },

   replyStatus: {

    type: String,

    enum: [

        'New',

        'In Progress',

        'Replied',

        'Closed'

    ],

    default: 'New'

}
   
}, {timestamps : true})
module.exports = mongoose.model('Form', formSchema)