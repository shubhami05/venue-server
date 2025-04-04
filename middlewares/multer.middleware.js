const multer = require("multer");
const fs = require("fs");
const path = require("path");
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

// Ensure the upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'temp');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory: ${uploadDir}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log(`Setting destination for file: ${file.originalname}`);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const newFilename = `${Date.now()}-${sanitizedFilename}`;
        console.log(`Generated filename for ${file.originalname}: ${newFilename}`);
        cb(null, newFilename);
    }
});

// Improved file filter with better error handling
const fileFilter = (req, file, cb) => {
    console.log(`Filtering file: ${file.originalname} (${file.mimetype})`);

    // Define allowed file types
    const allowedTypes = {
        'application/pdf': true,
        'image/jpeg': true,
        'image/jpg': true,
        'image/png': true,
        'image/gif': true
    };

    // Check file extension and mimetype
    const ext = path.extname(file.originalname).toLowerCase();
    const isValidExtension = /\.(pdf|jpg|jpeg|png|gif)$/i.test(ext);
    const isValidMimeType = allowedTypes[file.mimetype];

    if (!isValidExtension || !isValidMimeType) {
        const error = new Error(
            `Invalid file type. Only PDF, JPG, JPEG, PNG, and GIF files are allowed. Received: ${file.originalname} (${file.mimetype})`
        );
        error.code = 'INVALID_FILE_TYPE';
        console.error(`Rejected file: ${file.originalname} - Invalid type: ${file.mimetype}`);
        return cb(error, false);
    }

    console.log(`Accepted file: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
};

// Create multer instance with error handling
const uploadPdf = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 1 // Maximum number of files for owner registration
    }
}).single('aadharCard');

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 10 // Maximum number of files
    }
}).fields([
    { name: 'images', maxCount: 10 }
]);

// Enhanced cleanup function
const cleanupTempFiles = async (files) => {
    if (!files) return;

    try {
        const cleanupPromises = [];
        if (Array.isArray(files)) {
            for (const file of files) {
                if (fs.existsSync(file.path)) {
                    cleanupPromises.push(
                        unlinkFile(file.path)
                            .then(() => console.log(`Cleaned up temporary file: ${file.path}`))
                            .catch(err => console.error(`Error deleting file ${file.path}:`, err))
                    );
                }
            }
        } else if (files.path) {
            if (fs.existsSync(files.path)) {
                cleanupPromises.push(
                    unlinkFile(files.path)
                        .then(() => console.log(`Cleaned up temporary file: ${files.path}`))
                        .catch(err => console.error(`Error deleting file ${files.path}:`, err))
                );
            }
        }
        await Promise.all(cleanupPromises);
    } catch (error) {
        console.error('Error in cleanup process:', error);
    }
};

// Enhanced upload middleware with better error handling
const uploadMiddleware = (req, res, next) => {
    console.log('Starting file upload process...');

    upload(req, res, async function (err) {
        console.log('Upload callback triggered');

        // Handle file upload errors
        if (err) {
            console.error('File upload error:', err.code || 'UNKNOWN_ERROR');

            // Clean up any partially uploaded files
            if (req.files) {
                await cleanupTempFiles(req.files);
            } else if (req.file) {
                await cleanupTempFiles(req.file);
            }

            // Handle specific error types
            if (err instanceof multer.MulterError) {
                switch (err.code) {
                    case 'LIMIT_FILE_SIZE':
                        return res.status(400).json({
                            success: false,
                            message: "File is too large. Maximum size is 5MB"
                        });
                    case 'LIMIT_FILE_COUNT':
                        return res.status(400).json({
                            success: false,
                            message: "Too many files. Maximum is 10 files"
                        });
                    default:
                        return res.status(400).json({
                            success: false,
                            message: err.message || "File upload error"
                        });
                }
            }

            // Handle invalid file type errors
            if (err.code === 'INVALID_FILE_TYPE') {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                    code: 'INVALID_FILE_TYPE'
                });
            }

            // Handle any other errors
            return res.status(500).json({
                success: false,
                message: "File upload failed",
                error: err.message
            });
        }

        // If no files were uploaded when expected
        if (!req.files && !req.file) {
            console.log('No files were uploaded');
            return res.status(400).json({
                success: false,
                message: "No files were uploaded"
            });
        }

        // Log successful upload
        if (req.files) {
            console.log('Files uploaded successfully:', req.files?.images?.map(f => f.filename));
        } else if (req.file) {
            console.log('File uploaded successfully:', req.file?.filename);
        }

        // Attach cleanup function to request object
        req.cleanupFiles = async () => {
            if (req.files) {
                await cleanupTempFiles(req.files);
            } else if (req.file) {
                await cleanupTempFiles(req.file);
            }
        };

        next();
    });
};

module.exports = {
    upload: uploadMiddleware,
    cleanupTempFiles,
    uploadPdf
};