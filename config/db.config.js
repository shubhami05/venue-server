const mongoose = require("mongoose")

const connection = {}

async function dbConnect() {
    if (connection.isConnected) {
        return
    }
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI || "")
        connection.isConnected = db.connections[0].readyState;
        return db
    }
    catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1)
    }
}
module.exports = { dbConnect }