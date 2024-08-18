const mongoose = require("mongoose")

const connection = {}

async function dbConnect() {
    if (connection.isConnected) {
        console.log("Already connected to database")
        return
    }
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI || "")
        connection.isConnected = db.connections[0].readyState
        console.log("DB Connected successfully");
        return db
    }
    catch (err) {
        console.log("Database connection failed:", err);
        process.exit(1)
    }
}
module.exports = { dbConnect }