

const mongoose = require('mongoose')

async function connectDB (){

    try{
        
        await mongoose.connect(process.env.MONGO_URL);
        
        console.log('Connected To Database');
        
    }

    catch(err){

        console.error('Database Error :', err);

        process.exit(1)
        
    }
}

module.exports = connectDB;