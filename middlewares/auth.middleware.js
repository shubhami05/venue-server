const jwt = require("jsonwebtoken")
const { dbConnect } = require("../config/db.config")

async function VerifySession(req,res,next){
    try {
        await dbConnect();
        

    } 
    catch (error) {
        console.log(error)
        return res.status(500).json({
            success:false,
            message:"Something went wrong"
        })
    }
}

