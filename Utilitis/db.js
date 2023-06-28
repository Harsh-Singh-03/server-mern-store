const mongoose = require('mongoose')
require('dotenv/config')
const mongoUrl = process.env.DB_URL;


const connectToMongo = async () => {
    try {
        await mongoose.connect(mongoUrl)
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('Error connecting to MongoDB:', error.message);
    }
}

module.exports = connectToMongo;