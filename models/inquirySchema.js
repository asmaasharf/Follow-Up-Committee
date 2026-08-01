const mongoose = require('mongoose');

const inquirySchema = mongoose.Schema({

    createdBy: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'User',

        required: true

    },

    inquiry: {

        type: String,

        required: true,

        trim: true

    },

    reply: {

        type: String,

        default: ''

    },

    replyBy: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'User',

        default: null

    },

    responsePerson: {

        type: String,

        default: ''

    },

    replyDate: {

        type: Date,

        default: null

    },

    // status: {

    //     type: String,

    //     enum: ['Pending', 'Answered'],

    //     default: 'Pending'

    // }

}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);