const { handleMultipleUpload } = require("../config/cloudinary.config");
const { dbConnect } = require("../config/db.config");
const { VenueModel } = require("../models/venue.model");

async function ListNewVenue(req, res) {
    try {
        const owner = await req.owner;
        const ownerId = owner._id;
        const {
            name,
            type,
            address,
            city,
            bookingPay,
            description,
            cancellation,
            otherFacilities,
            restrictions,
            withoutFoodRent,
            withFoodRent,
            food,
            decoration,
            parking,
            locationURL,
            rooms,
            halls,
            events
        } = await req.body;

        const photos = await req.files;

        if (!food || (food.providedByVenue && !food.foodMenu)) {
            return res.status(404).json({
                success: false,
                message: "Some food details are missing, please fill it or contact support!"
            })
        }
        if (withFoodRent && (!withFoodRent.morning || !withFoodRent.evening || !withFoodRent.fullday)) {
            return res.status(404).json({
                success: false,
                message: "Some rent details are missing, please fill it or contact support!"
            })
        }
        if (withoutFoodRent && (!withoutFoodRent.morning || !withoutFoodRent.evening || !withoutFoodRent.fullday)) {
            return res.status(404).json({
                success: false,
                message: "Some rent details are missing, please fill it or contact support!"
            })
        }
        if (parking && parking.available && !parking.capacity) {
            return res.status(400).json({
                success: false,
                message: "Parking capacity is required when parking is available."
            });
        }

        const imageUrls = await handleMultipleUpload(photos);
        await dbConnect();

        const venue = new VenueModel({
            name,
            ownerId,
            type,
            bookingPay,
            address,
            city,
            description,
            locationURL,
            rooms,
            halls,
            cancellation,
            otherFacilities,
            restrictions,
            photos: imageUrls,
            withoutFoodRent,
            withFoodRent,
            food,
            decoration,
            parking,
            events
        });

        await venue.save();

        return res.status(200).json({
            success: true,
            message: "Venue added successfully!",
            venue
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
}

// Edit Venue
const editVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = await req.owner._id;
        const {
            name,
            type,
            bookingPay,
            address,
            city,
            description,
            locationURL,
            rooms,
            halls,
            cancellation,
            otherFacilities,
            restrictions,
            withoutFoodRent,
            withFoodRent,
            food,
            decoration,
            parking
        } = await req.body;
        const photos = await req.files;


        const venue = await VenueModel.findOne({ _id: id, ownerId });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found!"
            });
        }
        if (photos && photos.length > 0) {
            const uploadedPhotos = await handleMultipleUpload(photos);
            venue.photos = uploadedPhotos;
        }
        venue.name = name || venue.name;
        venue.type = type || venue.type;
        venue.bookingPay = bookingPay || venue.bookingPay;
        venue.address = address || venue.address;
        venue.city = city || venue.city;
        venue.description = description || venue.description;
        venue.locationURL = locationURL || venue.locationURL;
        venue.rooms = rooms || venue.rooms;
        venue.halls = halls || venue.halls;
        venue.cancellation = cancellation || venue.cancellation;
        venue.otherFacilities = otherFacilities || venue.otherFacilities;
        venue.restrictions = restrictions || venue.restrictions;
        venue.withoutFoodRent = withoutFoodRent || venue.withoutFoodRent;
        venue.withFoodRent = withFoodRent || venue.withFoodRent;
        venue.food = food || venue.food;
        venue.decoration = decoration || venue.decoration;
        venue.parking = parking || venue.parking;

        await venue.save();

        return res.status(200).json({
            success: true,
            message: "Venue updated successfully!",
            venue
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error!",
            error: error.message
        });
    }
};

// Delete Venue
const deleteVenue = async (req, res) => {
    try {
        const { id } = req.params;

        const venue = await VenueModel.findById(id);

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found!"
            });
        }

        await venue.remove();

        return res.status(200).json({
            success: true,
            message: "Venue deleted successfully!"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error!",
            error: error.message
        });
    }
};

// Get Single Venue
const getVenue = async (req, res) => {
    try {
        const { id } = req.params;

        const venue = await VenueModel.findById(id);

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found!"
            });
        }

        return res.status(200).json({
            success: true,
            venue
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error!",
            error: error.message
        });
    }
};

//Get Owner's Venues
const getOwnerVenues = async (req, res) => {
    try {
        const { ownerId } = req.params;

        const venues = await VenueModel.find({ ownerId });

        if (!venues || venues.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No venues found for this owner!"
            });
        }

        return res.status(200).json({
            success: true,
            venues
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error!",
            error: error.message
        });
    }
};

// Get All Venues for users
const getUserVenues = async (req, res) => {
    try {
        const venues = await VenueModel.find();

        if(!venues){
            return res.status(404).json({
                success:false,
                message:"No any venue available currently!"
            })
        }
        return res.status(200).json({
            success: true,
            message:"Venues fetched successfully!",
            venues
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error!",
            error: error.message
        });
    }
};
// Get All Venues
const getAdminVenues = async (req, res) => {
    try {
        const venues = await VenueModel.find();

        return res.status(200).json({
            success: true,
            venues
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error!",
            error: error.message
        });
    }
};

module.exports = {
    ListNewVenue,
    editVenue,
    deleteVenue,
    getVenue,
    getOwnerVenues,
    getAdminVenues,
    getUserVenues
};