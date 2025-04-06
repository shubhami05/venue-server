const { dbConnect } = require("../config/db.config");
const { BookingModel } = require("../models/booking.model");
const { VenueModel } = require("../models/venue.model");

// Function to check booking availability
const checkAvailability = async (req, res) => {
    try {
        await dbConnect();

        const { venueId, date, timeslot } = await req.body;

        // Validate required fields
        if (!venueId) {
            return res.status(400).json({
                success: false,
                message: "Please provide venueId"
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: "Please provide date"
            });
        }

        if (timeslot === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide timeslot"
            });
        }

        // Validate timeslot enum
        if (![0, 1, 2].includes(timeslot)) {
            return res.status(400).json({
                success: false,
                message: "Invalid timeslot. Must be 0 (morning), 1 (evening), or 2 (fullday)"
            });
        }

        // Convert date string to Date object for the start of the day
        const bookingDate = new Date(date);
        bookingDate.setHours(0, 0, 0, 0);

        console.log(bookingDate);
        // Find any bookings for the same venue and date
        const existingBookings = await BookingModel.find({
            venueId,
            date: bookingDate
        });

        let isAvailable = true;
        if (existingBookings.length > 0) {
            for (const booking of existingBookings) {
                if (booking.timeslot === 2 || // Full day booking exists
                    timeslot === 2 || // Requesting full day
                    timeslot === booking.timeslot) { // Same timeslot
                    isAvailable = false;
                    break;
                }
            }
        }
        
        // if (existingBookings.length > 0) {
        //     // Check availability based on timeslot rules
        //     for (const booking of existingBookings) {
        //         // If there's a full day booking, venue is not available
        //         if (booking.timeslot === 2) {
        //             isAvailable = false;
        //             break;
        //         }
                
        //         // If requesting full day and there's any booking, venue is not available
        //         if (timeslot === 2) {
        //             isAvailable = false;
        //             break;
        //         }
                
        //         // If requesting morning/evening and that slot is already booked
        //         if (timeslot === booking.timeslot) {
        //             isAvailable = false;
        //             break;
        //         }
        //     }
        // }

        return res.status(200).json({
            success: true,
            isAvailable,
            message: isAvailable 
                ? "Venue is available for the requested time slot" 
                : "Venue is not available for the requested time slot",
            existingBookings: existingBookings.map(booking => ({
                timeslot: booking.timeslot,
                date: booking.date
            }))
        });

    } catch (error) {
        console.error("Error in checkAvailability:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Original BookVenue function
const BookVenue = async (req, res) => {
    try {
        const user = await req.user;
        await dbConnect();

        const {
            venueId,
            date,
            timeslot,
            numberOfGuest,
        } = req.body;

        // First check availability
        const availabilityCheck = await checkAvailabilityHelper(venueId, date, timeslot);
        
        if (!availabilityCheck.isAvailable) {
            return res.status(409).json({
                success: false,
                message: "Venue is not available for the requested time slot"
            });
        }

        // Create new booking
        const newBooking = new BookingModel({
            venueId,
            userId: user._id, // Assuming you have user info in request
            date: new Date(date),
            timeslot,
            numberOfGuest
        });

        await newBooking.save();

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking: newBooking
        });

    } catch (error) {
        console.error("Error in BookVenue:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Helper function for internal availability checks
const checkAvailabilityHelper = async (venueId, date, timeslot) => {
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    

    const existingBookings = await BookingModel.find({
        venueId,
        date: bookingDate
    });

    let isAvailable = true;
    
    if (existingBookings.length > 0) {
        for (const booking of existingBookings) {
            if (booking.timeslot === 2 || // Full day booking exists
                timeslot === 2 || // Requesting full day
                timeslot === booking.timeslot) { // Same timeslot
                isAvailable = false;
                break;
            }
        }
    }

    return {
        isAvailable,
        existingBookings
    };
};

// Fetch all bookings for admin
const getAllBookings = async (req, res) => {
    try {
        await dbConnect();
        
        // Retrieve all bookings with populated venue and user details
        const bookings = await BookingModel.find({})
            .populate('venueId', 'name city address type')
            .populate('userId', 'fullname email mobile')
            .sort({ createdAt: -1 }); // Sort by newest first
        
        // Transform the response to make it easier to use in the frontend
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            venue: {
                _id: booking.venueId._id,
                name: booking.venueId.name,
                city: booking.venueId.city,
                address: booking.venueId.address,
                type: booking.venueId.type
            },
            user: {
                _id: booking.userId._id,
                name: booking.userId.fullname,
                email: booking.userId.email,
                phone: booking.userId.mobile
            },
            date: booking.date,
            timeslot: booking.timeslot,
            numberOfGuest: booking.numberOfGuest,
            confirmed: booking.confirmed,
            createdAt: booking.createdAt
        }));

        return res.status(200).json({
            success: true,
            message: 'Bookings fetched successfully',
            bookings: formattedBookings
        });
    } catch (error) {
        console.error('Error in fetchAllBookings:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
// Get user's bookings
const getUserBookings = async (req, res) => {
    try {
        await dbConnect();
        
        const userId = req.user._id; // Get user ID from middleware
        
        // Retrieve all bookings for the user with populated venue details
        const bookings = await BookingModel.find({ userId })
            .populate('venueId', 'name city address type cancellation cancellationPolicy')
            .sort({ createdAt: -1 }); // Sort by newest first
        
        // Transform the response to make it easier to use in the frontend
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            venue: {
                _id: booking.venueId._id,
                name: booking.venueId.name,
                city: booking.venueId.city,
                address: booking.venueId.address,
                type: booking.venueId.type,
                cancellation: booking.venueId.cancellation,
                cancellationPolicy: booking.venueId.cancellationPolicy || '',    
            },
            date: booking.date,
            timeslot: booking.timeslot,
            numberOfGuest: booking.numberOfGuest,
            confirmed: booking.confirmed,
            createdAt: booking.createdAt
        }));

        return res.status(200).json({
            success: true,
            message: 'User bookings fetched successfully',
            bookings: formattedBookings
        });
    } catch (error) {
        console.error('Error in getUserBookings:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
// Fetch all bookings for owner's venues
const getOwnerVenuesBookings = async (req, res) => {
    try {
        await dbConnect();
        
        const ownerId = req.user._id; // Get owner ID from middleware
        
        // First get all venues owned by this owner
        const venues = await VenueModel.find({ ownerId }, '_id');
        const venueIds = venues.map(venue => venue._id);
        
        // Retrieve all bookings for these venues with populated user details
        const bookings = await BookingModel.find({ venueId: { $in: venueIds } })
            .populate('venueId', 'name city address type')
            .populate('userId', 'fullname email mobile')
            .sort({ createdAt: -1 }); // Sort by newest first
        
        // Transform the response to make it easier to use in the frontend
        const formattedBookings = bookings.map(booking => ({
            _id: booking._id,
            venue: {
                _id: booking.venueId._id,
                name: booking.venueId.name,
                city: booking.venueId.city,
                address: booking.venueId.address,
                type: booking.venueId.type
            },
            user: {
                _id: booking.userId._id,
                name: booking.userId.fullname,
                email: booking.userId.email,
                phone: booking.userId.mobile
            },
            date: booking.date,
            timeslot: booking.timeslot,
            numberOfGuest: booking.numberOfGuest,
            confirmed: booking.confirmed,
            createdAt: booking.createdAt
        }));

        return res.status(200).json({
            success: true,
            message: 'Owner venue bookings fetched successfully',
            bookings: formattedBookings
        });
    } catch (error) {
        console.error('Error in getOwnerVenuesBookings:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};


// Fetch a specific booking by ID
const getBookingById = async (req, res) => {
    try {
        await dbConnect();
        
        const { bookingId } = req.params;
        
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking ID'
            });
        }
        
        // Retrieve the booking with populated venue and user details
        const booking = await BookingModel.findById(bookingId)
            .populate('venueId', 'name city address type withoutFoodRent withFoodRent')
            .populate('userId', 'fullname email mobile');
            
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        // Format the response
        const formattedBooking = {
            _id: booking._id,
            venue: {
                _id: booking.venueId._id,
                name: booking.venueId.name,
                city: booking.venueId.city,
                address: booking.venueId.address,
                type: booking.venueId.type,
                withoutFoodRent: booking.venueId.withoutFoodRent,
                withFoodRent: booking.venueId.withFoodRent
            },
            user: {
                _id: booking.userId._id,
                name: booking.userId.fullname,
                email: booking.userId.email,
                phone: booking.userId.mobile
            },
            date: booking.date,
            timeslot: booking.timeslot,
            numberOfGuest: booking.numberOfGuest,
            confirmed: booking.confirmed,
            createdAt: booking.createdAt
        };
        
        return res.status(200).json({
            success: true,
            message: 'Booking fetched successfully',
            booking: formattedBooking
        });
    } catch (error) {
        console.error('Error in fetchBookingById:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Confirm a booking
const confirmBooking = async (req, res) => {
    try {
        await dbConnect();
        
        const { bookingId } = req.params;
        
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking ID'
            });
        }
        
        // Find and update the booking
        const booking = await BookingModel.findByIdAndUpdate(
            bookingId,
            { confirmed: true },
            { new: true }
        );
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Booking confirmed successfully',
            booking
        });
    } catch (error) {
        console.error('Error in confirmBooking:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete a booking
const deleteBooking = async (req, res) => {
    try {
        await dbConnect();
        
        const { bookingId } = req.params;
        
        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking ID'
            });
        }
        
        // Find and remove the booking
        const booking = await BookingModel.findByIdAndDelete(bookingId);
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteBooking:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = { 
    BookVenue, 
    checkAvailability, 
    getAllBookings, 
    getBookingById, 
    confirmBooking, 
    deleteBooking,
    getUserBookings,
    getOwnerVenuesBookings
};