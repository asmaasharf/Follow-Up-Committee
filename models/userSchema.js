const mongoose = require('mongoose')
const bcrypt = require('bcrypt')


const userSchema = mongoose.Schema({

    city : {
        type : String,
        required : true
    }, 

    fullName: {
    type: String,
    required: true,
    trim: true
},

nationalId: {
    type: String,
    required: true,
    unique: true
},

phone: {
    type: String,
    required: true
},

jobTitle: {
    type: String,
    required: true
},
    username : {
        type : String,
        required : true,
        trim : true
    },
    password : {
        type : String,
        required : true,
    
    },
    role : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Role',
        // required : true,
        default : null,
    },
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Inactive', 'Rejected'],
        default: 'Pending'
},
    approvedBy: {

    type: mongoose.Schema.Types.ObjectId,

    ref: 'User',

    default: null

},

    approvedDate: {

    type: Date,

    default: null

},

   
}, {timestamps : true})
userSchema.methods.hashPassword = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(12))
}
userSchema.methods.comparePassword = function(password){
    return bcrypt.compare(password, this.password)
}

module.exports = mongoose.model('User', userSchema)