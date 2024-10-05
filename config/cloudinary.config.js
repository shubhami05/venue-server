const cloudinary = require('cloudinary').v2
const fs = require("fs")

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

async function uploadOnCloudinary(localFilePath) {
    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        console.log("File uploaded successfully on cloudinary", response.url);
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) //it will remove file from server
        return null
    }
}
async function handleMultipleUpload(imageArray) {
    try {
        if (imageArray.length === 0) return null
        const uploadPromises = imageArray.map(async (img) => {
            const response = await uploadOnCloudinary(img.path);
            return response.url;
        });

        const imageUrls = await Promise.all(uploadPromises);
        return imageUrls;
    }
    catch (error) {
        console.log(error)
        return null
    }
}
module.exports = {
    uploadOnCloudinary,
    handleMultipleUpload
}