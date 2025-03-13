const multer = require("multer")
const fs = require("fs")
const path = require("path")

// Ensure the upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'temp')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Sanitize filename to prevent errors
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')
        cb(null, `${Date.now()}-${sanitizedFilename}`)
    }
})

// Add file filter to only accept images
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false)
    }
    cb(null, true)
}

// Create multer instance with error handling
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
}).fields([
    { name: 'photos', maxCount: 10 }
])

// Wrapper function to handle multer errors
const uploadMiddleware = (req, res, next) => {
    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading
            console.error("Multer error:", err)
            return res.status(400).json({
                success: false,
                message: err.message || "File upload error"
            })
        } else if (err) {
            // An unknown error occurred
            console.error("Unknown upload error:", err)
            return res.status(500).json({
                success: false,
                message: "File upload failed"
            })
        }
        // Everything went fine
        next()
    })
}

module.exports = { upload: uploadMiddleware }