const mongoose = require("mongoose")

const dbConnect = async () => {
    try {
        // Check if there's already an active connection
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB already connected');
            return;
        }

        // Set mongoose options
        mongoose.set('strictQuery', false);
        
        // Updated connection options with only supported options
        const connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 15000,
            dbName: process.env.DB_NAME, // Specify the database name if needed
        };

        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Add connection error handlers
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error('Database connection error:', error);
        // Retry connection after 5 seconds
        setTimeout(dbConnect, 5000);
    }
}

module.exports = { dbConnect }