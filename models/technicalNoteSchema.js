const mongoose = require('mongoose');

const technicalNoteSchema = new mongoose.Schema({

    serviceCode: {

        type: String,

        required: true

    },

    note: {

        type: String,

        required: true

    },

    createdBy: {

        type: mongoose.Schema.Types.ObjectId,

        ref: 'User',

        required: true

    }

}, {

    timestamps: true

});

module.exports = mongoose.model('TechnicalNote', technicalNoteSchema);