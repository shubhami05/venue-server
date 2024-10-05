const { handleMultipleUpload } = require("../config/cloudinary.config");
const { dbConnect } = require("../config/db.config");
const { VenueModel } = require("../models/venue.model");


async function ListNewVenue(req, res) {
    try {
        const owner = await req.owner;
        const ownerId = owner._id;
        const { name, type, price, locationURL, foodType, parkingSpace, peopleCapacity, rooms, halls } = await req.body;
        const photos = await req.files;
        const imageUrls = await handleMultipleUpload(photos);

        await dbConnect();
        const venue = new VenueModel({
            name,
            ownerId,
            type,
            price,
            locationURL,
            foodType,
            parkingSpace,
            peopleCapacity,
            rooms,
            halls,
            photos: imageUrls
        })

        await venue.save();

        return res.status(200).json({
            success: true,
            message: "Venue added successfully!"
        })


    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!"
        })
    }
}

module.exports = { ListNewVenue }