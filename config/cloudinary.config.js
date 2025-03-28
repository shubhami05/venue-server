require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (files) => {
    const uploadPromises = files.map(file => {
        return new Promise((resolve, reject) => {
            console.log(`Uploading file to Cloudinary: ${file.path}`);
            cloudinary.uploader.upload(file.path, (error, result) => {
                if (error) {
                    console.error(`Cloudinary upload error for file ${file.path}:`, error);
                    reject(error);
                } else {
                    console.log(`Uploaded file to Cloudinary: ${result.secure_url}`);
                    resolve(result.secure_url);
                }
            });
        });
    });

    const results = await Promise.all(uploadPromises);

    // Clean up local files after upload
    await Promise.all(files.map(file => unlinkFile(file.path)));

    return results;
};

module.exports = { uploadToCloudinary };