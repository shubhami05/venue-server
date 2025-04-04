const { uploadToCloudinary } = require("../config/cloudinary.config");
const { dbConnect } = require("../config/db.config");
const { VenueModel } = require("../models/venue.model");
const { cleanupTempFiles } = require('../middlewares/multer.middleware');
const { default: mongoose } = require("mongoose");

async function ListNewVenue(req, res) {
    const user = await req.user; // Assuming req.user is the object being accessed
    if (!user || !user._id) {
        return res.status(400).json({
            success: false,
            message: "User ID is missing"
        });
    }

    try {
        const ownerId = user._id;

        // Extract form data
        let {
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
            events,
            amenities,
            rules,
            cancellationPolicy
        } = req.body;

        // Parse JSON strings if they exist
        try {
            if (typeof otherFacilities === 'string') otherFacilities = JSON.parse(otherFacilities);
            if (typeof restrictions === 'string') restrictions = JSON.parse(restrictions);
            if (typeof events === 'string') events = JSON.parse(events);
            if (typeof amenities === 'string') amenities = JSON.parse(amenities);
            if (typeof withoutFoodRent === 'string') withoutFoodRent = JSON.parse(withoutFoodRent);
            if (typeof withFoodRent === 'string') withFoodRent = JSON.parse(withFoodRent);
            if (typeof food === 'string') food = JSON.parse(food);
            if (typeof decoration === 'string') decoration = JSON.parse(decoration);
            if (typeof parking === 'string') parking = JSON.parse(parking);
        } catch (parseError) {
            console.error("Error parsing JSON data:", parseError);
            return res.status(400).json({
                success: false,
                message: "Invalid data format. Please check your input."
            });
        }

        // Get uploaded files
        const photos = req.files?.photos || req.files?.images || [];
        console.log(`Received ${photos.length} photos for upload`);

        // Validate required fields
        if (!name || !type || !address || !city) {
            return res.status(400).json({
                success: false,
                message: "Required fields are missing. Please fill all required fields."
            });
        }

        // Validate food details
        // if (!food) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Some food details are missing, please fill it or contact support!"
        //     });
        // }

        // Validate rent details
        if (food.providedByVenue && (!withFoodRent.morning || !withFoodRent.evening || !withFoodRent.fullday)) {
            return res.status(400).json({
                success: false,
                message: "Some rent details are missing, please fill it or contact support!"
            });
        }

        if (!withoutFoodRent.morning || !withoutFoodRent.evening || !withoutFoodRent.fullday) {
            return res.status(400).json({
                success: false,
                message: "Some with out rent details are missing, please fill it or contact support!"
            });
        }

        // Validate parking details
        if (parking && parking.available && !parking.capacity) {
            return res.status(400).json({
                success: false,
                message: "Parking capacity is required when parking is available."
            });
        }

        // Handle file uploads
        let imageUrls = [];
        if (photos && photos.length > 0) {
            imageUrls = await uploadToCloudinary(photos);
            if (!imageUrls || imageUrls.length === 0) {
                await req.cleanupFiles();
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload images. Please try again."
                });
            }
        }

        // Connect to database
        await dbConnect();

        // Create venue object
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
            otherFacilities: otherFacilities || [],
            restrictions: restrictions || [],
            photos: imageUrls,
            withoutFoodRent,
            withFoodRent,
            food,
            decoration,
            parking,
            events: events || [],
            amenities: amenities || [],
            rules,
            cancellationPolicy
        });

        // Save venue to database
        await venue.save();

        // Clean up temp files after successful save
        await req.cleanupFiles();

        return res.status(200).json({
            success: true,
            message: "Venue added successfully!",
            venue
        });

    } catch (error) {
        console.error("Venue creation error:", error);
        if (req.files) {
            await cleanupTempFiles(req.files);
        }
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
        const { venueId } = await req.params;
        const ownerId = await req.user._id;

        // Extract form data
        let {
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
            parking,
            events,
            amenities,
            rules,
            cancellationPolicy,
            existingImages,
            removedImages
        } = req.body;

        // Parse JSON strings
        try {
            if (typeof otherFacilities === 'string') otherFacilities = JSON.parse(otherFacilities);
            if (typeof restrictions === 'string') restrictions = JSON.parse(restrictions);
            if (typeof events === 'string') events = JSON.parse(events);
            if (typeof amenities === 'string') amenities = JSON.parse(amenities);
            if (typeof withoutFoodRent === 'string') withoutFoodRent = JSON.parse(withoutFoodRent);
            if (typeof withFoodRent === 'string') withFoodRent = JSON.parse(withFoodRent);
            if (typeof food === 'string') food = JSON.parse(food);
            if (typeof decoration === 'string') decoration = JSON.parse(decoration);
            if (typeof parking === 'string') parking = JSON.parse(parking);
            if (typeof existingImages === 'string') existingImages = JSON.parse(existingImages);
            if (typeof removedImages === 'string') removedImages = JSON.parse(removedImages);
        } catch (parseError) {
            console.error("Error parsing JSON data:", parseError);
            return res.status(400).json({
                success: false,
                message: "Invalid data format. Please check your input."
            });
        }

        const venue = await VenueModel.findOne({ _id: venueId, ownerId });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found!"
            });
        }

        // Handle image updates
        let updatedPhotos = [];

        // Keep existing images that weren't removed
        if (existingImages && Array.isArray(existingImages)) {
            updatedPhotos = [...existingImages];
        }

        // Add newly uploaded images
        if (req.files?.images && req.files.images.length > 0) {
            const newImageUrls = await uploadToCloudinary(req.files.images);
            if (newImageUrls && newImageUrls.length > 0) {
                updatedPhotos = [...updatedPhotos, ...newImageUrls];
            }
        }

        // Update venue fields
        venue.name = name || venue.name;
        venue.type = type || venue.type;
        venue.bookingPay = bookingPay || venue.bookingPay;
        venue.address = address || venue.address;
        venue.city = city || venue.city;
        venue.description = description || venue.description;
        venue.locationURL = locationURL || venue.locationURL;
        venue.rooms = rooms || venue.rooms;
        venue.halls = halls || venue.halls;
        venue.cancellation = cancellation !== undefined ? cancellation : venue.cancellation;
        venue.otherFacilities = otherFacilities || venue.otherFacilities;
        venue.restrictions = restrictions || venue.restrictions;
        venue.withoutFoodRent = withoutFoodRent || venue.withoutFoodRent;
        venue.withFoodRent = withFoodRent || venue.withFoodRent;
        venue.food = food || venue.food;
        venue.decoration = decoration || venue.decoration;
        venue.parking = parking || venue.parking;
        venue.events = events || venue.events;
        venue.amenities = amenities || venue.amenities;
        venue.rules = rules !== undefined ? rules : venue.rules;
        venue.cancellationPolicy = cancellationPolicy !== undefined ? cancellationPolicy : venue.cancellationPolicy;
        venue.photos = updatedPhotos;

        await venue.save();

        // Clean up temp files
        if (req.files) {
            await req.cleanupFiles();
        }

        return res.status(200).json({
            success: true,
            message: "Venue updated successfully!",
            venue
        });
    } catch (error) {
        console.error("Venue update error:", error);
        if (req.files) {
            await cleanupTempFiles(req.files);
        }
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
        const { venueId } = req.params;
        const ownerId = req.user._id;

        // First check if venue exists and belongs to owner
        const venue = await VenueModel.findOne({ _id: venueId, ownerId });

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found!"
            });
        }

        // Check for any existing bookings
        const existingBookings = await BookingModel.find({
            venueId: venueId,
            date: { $gte: new Date() } // Only check future bookings
        });

        if (existingBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete venue with upcoming bookings!",
                bookings: existingBookings
            });
        }

        // If no bookings exist, proceed with deletion
        await VenueModel.deleteOne({ _id: venueId });

        return res.status(200).json({
            success: true,
            message: "Venue deleted successfully!"
        });
    } catch (error) {
        console.error("Venue delete error:", error);
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
        const { venueId } = req.params;

        // First check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            await dbConnect(); // Reconnect if not connected
        }

        // Add timeout options to the aggregation
        const options = {
            maxTimeMS: 20000, // Set maximum execution time to 20 seconds
            allowDiskUse: true // Allow using disk for large datasets
        };

        const venueWithOwner = await VenueModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(venueId) }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'ownerId',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            {
                $unwind: '$owner'
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    type: 1,
                    bookingPay: 1,
                    address: 1,
                    city: 1,
                    description: 1,
                    locationURL: 1,
                    rooms: 1,
                    halls: 1,
                    cancellation: 1,
                    otherFacilities: 1,
                    restrictions: 1,
                    photos: 1,
                    events: 1,
                    withoutFoodRent: 1,
                    withFoodRent: 1,
                    food: 1,
                    decoration: 1,
                    parking: 1,
                    amenities: 1,
                    rules: 1,
                    cancellationPolicy: 1,
                    'owner.name': '$owner.fullname',
                    'owner.email': '$owner.email',
                    'owner.phone': '$owner.mobile'
                }
            }
        ]).option(options);

        if (!venueWithOwner.length) {
            return res.status(404).json({
                success: false,
                message: "Venue not found!"
            });
        }

        return res.status(200).json({
            success: true,
            venue: venueWithOwner[0]
        });
    } catch (error) {
        console.error('Venue fetch error:', error);
        
        // Handle specific timeout error
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({
                success: false,
                message: "Database operation timed out. Please try again.",
                error: 'OPERATION_TIMEOUT'
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error!",
            error: error.message
        });
    }
};

// Get Owner's Venues
const getOwnerVenues = async (req, res) => {
    try {
        const ownerId = await req.user._id;

        const venues = await VenueModel.find({ ownerId });

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
const getAllVenues = async (req, res) => {
    try {
        // Check connection state
        if (mongoose.connection.readyState !== 1) {
            await dbConnect();
        }

        const options = {
            maxTimeMS: 20000,
            allowDiskUse: true
        };

        const venues = await VenueModel.aggregate([
            {
                $match: { status: 'accepted' }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'ownerId',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            {
                $unwind: '$owner'
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    type: 1,
                    address: 1,
                    city: 1,
                    description: 1,
                    locationURL: 1,
                    rooms: 1,
                    halls: 1,
                    bookingPay: 1,
                    cancellation: 1,
                    otherFacilities: 1,
                    restrictions: 1,
                    photos: 1,
                    events: 1,
                    withoutFoodRent: 1,
                    withFoodRent: 1,
                    food: 1,
                    decoration: 1,
                    parking: 1,
                    amenities: 1,
                    rules: 1,
                    cancellationPolicy: 1,
                    'owner.name': '$owner.fullname',
                    'owner.email': '$owner.email',
                    'owner.phone': '$owner.mobile'
                }
            }
        ]).option(options);

        if (!venues || venues.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No venues available currently!"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Venues fetched successfully!",
            venues
        });
    } catch (error) {
        console.error('Venues fetch error:', error);

        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({
                success: false,
                message: "Database operation timed out. Please try again.",
                error: 'OPERATION_TIMEOUT'
            });
        }

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
    getAllVenues
};