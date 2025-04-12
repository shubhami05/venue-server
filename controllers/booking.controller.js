const { dbConnect } = require("../config/db.config");
const { BookingModel } = require("../models/booking.model");
const { VenueModel } = require("../models/venue.model");
const { PLATFORM_FEE_DECIMAL } = require("../config/stripe.config");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

        console.log("date in normal avbailabilty:", bookingDate);
        // Find any bookings for the same venue and date
        const existingBookings = await BookingModel.find({
            venueId,
            date: bookingDate,
            isCancelled: false
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
        const user = req.user;
        await dbConnect();

        const {
            venueId,
            date,
            timeslot,
            numberOfGuest,
        } = req.body;
        const newdate = new Date(date);
        // First check availability
        const availabilityCheck = await checkAvailabilityHelper(venueId, newdate, timeslot);

        if (!availabilityCheck.isAvailable) {
            return res.status(409).json({
                success: false,
                message: "Venue is not available for the requested time slot"
            });
        }

        // Get venue details to calculate amount
        const venue = await VenueModel.findById(venueId);
        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found"
            });
        }
        let amount = venue.bookingPay;
        const platformFee = Math.round(amount * PLATFORM_FEE_DECIMAL);
        const totalAmount = amount + platformFee;
        const ownerEarnings = amount - platformFee;

        // Create Stripe Payment Intent with all booking details in metadata
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount * 100, // Convert to cents
            currency: 'inr',
            metadata: {
                venueId: venueId.toString(),
                userId: user._id.toString(),
                date: date,
                timeslot: timeslot.toString(),
                numberOfGuest: numberOfGuest.toString(),
                amount: amount.toString(),
                platformFee: platformFee.toString(),
                totalAmount: totalAmount.toString(),
                ownerEarnings: ownerEarnings.toString()
            },
            automatic_payment_methods: {
                enabled: true,
            }
        });

        return res.status(201).json({
            success: true,
            message: "Payment intent created successfully",
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
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
    try {
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

        if (![0, 1, 2].includes(timeslot)) {
            return res.status(400).json({
                success: false,
                message: "Invalid timeslot. Must be 0 (morning), 1 (evening), or 2 (fullday)"
            });
        }

        await dbConnect();

        // Find any bookings for the same venue and date
        const existingBookings = await BookingModel.find({
            venueId,
            date: date,
            isCancelled: false
        });

        console.log('Searching for bookings on date:', date);
        console.log('Found bookings:', existingBookings);

        let isAvailable = true;
        let message = "Venue is available for the requested time slot";

        if (existingBookings.length > 0) {
            for (const booking of existingBookings) {
                // Since timeslot is stored as a number in the model, no need for parseInt
                const existingTimeslot = booking.timeslot;
                const requestedTimeslot = timeslot;

                if (existingTimeslot === 2) { // Full day booking exists
                    isAvailable = false;
                    message = "Venue is already booked for the full day";
                    break;
                } else if (requestedTimeslot === 2) { // Requesting full day
                    isAvailable = false;
                    message = "Cannot book full day as venue is already booked for part of the day";
                    break;
                } else if (existingTimeslot === requestedTimeslot) { // Same timeslot
                    isAvailable = false;
                    message = `Venue is already booked for the ${requestedTimeslot === 0 ? 'morning' : 'evening'} slot`;
                    break;
                }
            }
        }

        return {
            isAvailable,
            message,
            existingBookings: existingBookings.map(booking => ({
                timeslot: booking.timeslot,
                date: booking.date
            }))
        };
    } catch (error) {
        console.error("Error in checkAvailabilityHelper:", error);
        throw error;
    }
};

// Fetch all bookings for admin
const getAllBookings = async (req, res) => {
    try {
        await dbConnect();

        // Retrieve all bookings with populated venue and user details
        const bookings = await BookingModel.find({ isOwnerReservation: false })
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
            amount: booking.totalAmount,
            paymentStatus: booking.paymentStatus,
            date: booking.date,
            timeslot: booking.timeslot,
            numberOfGuest: booking.numberOfGuest,
            isCancelled: booking.isCancelled,
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
        const bookings = await BookingModel.find({
            userId
        })
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
            paymentStatus: booking.paymentStatus,
            createdAt: booking.createdAt,
            isCancelled: booking.isCancelled
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
        const bookings = await BookingModel.find({ venueId: { $in: venueIds }, isOwnerReservation: false })
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
            amount: booking.amount,
            date: booking.date,
            timeslot: booking.timeslot,
            numberOfGuest: booking.numberOfGuest,
            paymentStatus: booking.paymentStatus,
            isCancelled: booking.isCancelled,
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
            paymentStatus: booking.paymentStatus,
            isCancelled: booking.isCancelled,
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



// Delete a booking
const deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id;
        await dbConnect();

        // Find the booking
        const booking = await BookingModel.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }
        await BookingModel.findByIdAndDelete(bookingId);

  
        
        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            booking
        });
    } catch (error) {
        console.error("Error in deleteBooking:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Create a new booking
const createBooking = async (req, res) => {
    try {
        const { venueId, date, timeslot, numberOfGuest, amount } = req.body;
        const userId = req.user._id;

        // Validate input
        if(timeslot === undefined){
            return res.status(400).json({
                success: false,
                message: 'Please provide timeslot'
            });
        }
        if (!venueId || !date || !numberOfGuest || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Calculate platform fee (3%)
        const platformFee = amount * PLATFORM_FEE_DECIMAL;
        const totalAmount = amount + platformFee;

        // Create payment intent with total amount
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: 'inr',
            metadata: {
                venueId: venueId,
                userId: userId.toString(),
                date: date,
                timeslot: timeslot.toString(),
                numberOfGuest: numberOfGuest.toString(),
                amount: amount.toString(),
                platformFee: platformFee.toString(),
                totalAmount: totalAmount.toString(),
                ownerEarnings: (amount - platformFee).toString()
            }
        });

        res.status(201).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: totalAmount
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment intent',
            error: error.message
        });
    }
};

// Update confirmPayment function to handle the actual booking confirmation
const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = await req.body;
        await dbConnect();

        if(!paymentIntentId){
            return res.status(400).json({
                success: false,
                message: 'Please provide payment intent ID'
            });
        }
        console.log("paymentIntentId:", paymentIntentId);
        
        // Retrieve payment intent to get metadata
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        // Create the booking with completed status
        const booking = await BookingModel.create({
            venueId: paymentIntent.metadata.venueId,
            userId: paymentIntent.metadata.userId,
            date: paymentIntent.metadata.date,
            timeslot: parseInt(paymentIntent.metadata.timeslot),
            numberOfGuest: parseInt(paymentIntent.metadata.numberOfGuest),
            amount: parseFloat(paymentIntent.metadata.amount),
            platformFee: parseFloat(paymentIntent.metadata.platformFee),
            totalAmount: parseFloat(paymentIntent.metadata.totalAmount),
            paymentStatus: 'completed',
            stripePaymentId: paymentIntentId
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Failed to create booking"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: "Payment confirmed and booking created successfully",
            booking
        });
    } catch (error) {
        console.error("Error in confirmPayment:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
    try {
        await dbConnect();

        const { bookingId } = req.params;
        const userId = req.user._id;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide booking ID'
            });
        }

        // Find the booking and verify ownership
        const booking = await BookingModel.findOne({
            _id: bookingId,
            userId: userId
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found or you do not have permission to cancel this booking'
            });
        }

        // Check if booking is already cancelled
        if (booking.isCancelled) {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // Check if booking date is in the past
        const bookingDate = new Date(booking.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (bookingDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel past bookings'
            });
        }

        // Update booking status to cancelled
        booking.isCancelled = true;
        await booking.save();

        return res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            booking
        });
    } catch (error) {
        console.error('Error in cancelBooking:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Create a reservation (for venue owners)
const createOwnerReservation = async (req, res) => {
    try {
        const { venueId, date, timeslot } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!venueId || !date || !timeslot ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Get venue details to calculate amount
        const venue = await VenueModel.findById(venueId);
        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue not found'
            });
        }

        // Calculate base amount based on timeslot and guests
        let baseAmount = 0;
        if (timeslot === 'morning') {
            baseAmount = venue.pricing.morning * guests;
        } else if (timeslot === 'evening') {
            baseAmount = venue.pricing.evening * guests;
        } else if (timeslot === 'fullDay') {
            baseAmount = venue.pricing.fullDay * guests;
        }

        // Calculate platform fee (3% of base amount)
      
        // Create booking
        const booking = await BookingModel.create({
            venueId,
            userId,
            date,
            timeslot,
            numberOfGuest:0,
            amount: baseAmount,
            platformFee:0,
            totalAmount:0,
            isOwnerReservation:true,
            paymentStatus: 'completed',
            status: 'confirmed'
        });

        res.status(201).json({
            success: true,
            message: 'Reservation created successfully',
            booking
        });
    } catch (error) {
        console.error('Error in createOwnerReservation:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Remove owner reservation
const removeOwnerReservation = async (req, res) => {
    try {
        const { reservationId } = req.params;
        const userId = req.user._id;

        // Find the booking
        const booking = await BookingModel.findById(reservationId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Check if the booking belongs to the owner
        if (booking.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to remove this reservation"
            });
        }

        // Check if the booking is an owner reservation
        if (!booking.isOwnerReservation) {
            return res.status(403).json({
                success: false,
                message: "This is not an owner reservation"
            });
        }

        // Remove the booking
        await BookingModel.findByIdAndDelete(reservationId);

        return res.status(200).json({
            success: true,
            message: "Reservation removed successfully"
        });
    } catch (error) {
        console.error("Error in removeOwnerReservation:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get owner reservations
const getOwnerReservations = async (req, res) => {
    try {
        const userId = req.user._id;

        const reservations = await BookingModel.find({
            userId,
            isOwnerReservation: true,
            isCancelled: false // Only fetch non-cancelled reservations
        }).populate('venueId', 'name city address type');

        if (reservations.length === 0) {
            return res.status(201).json({
                success: true,
                message: "No reservations found",
                reservations: []
            });
        }

        // Format the response to include venue details
        const formattedReservations = reservations.map(reservation => ({
            _id: reservation._id,
            venue: {
                _id: reservation.venueId._id,
                name: reservation.venueId.name,
                city: reservation.venueId.city,
                address: reservation.venueId.address,
                type: reservation.venueId.type
            },
            date: reservation.date,
            timeslot: reservation.timeslot,
            createdAt: reservation.createdAt
        }));

        return res.status(200).json({
            success: true,
            message: "Owner reservations fetched successfully",
            reservations: formattedReservations
        });
    } catch (error) {
        console.error("Error in getOwnerReservations:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


module.exports = {
    BookVenue,
    checkAvailability,
    getAllBookings,
    getBookingById,
    deleteBooking,
    getUserBookings,
    getOwnerVenuesBookings,
    confirmPayment,
    cancelBooking,
    createOwnerReservation,
    removeOwnerReservation,
    getOwnerReservations,
    createBooking
};