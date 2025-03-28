const { UserModel } = require("../models/user.model");
const { VenueModel } = require("../models/venue.model");
const { dbConnect } = require("../config/db.config");

// Fetch all users
const getAllUsers = async (req, res) => {
    try {
        await dbConnect();
        
        // Get all users with selected fields
        const users = await UserModel.find()
            .select('fullname email role createdAt mobile')
            .sort({ createdAt: -1 });

        // Format the response
        const formattedUsers = users.map(user => ({
            _id: user._id,
            name: user.fullname,
            email: user.email,
            role: user.role,
            status: user.status,
            phone: user.mobile || 'N/A',
            joinedDate: user.createdAt.toISOString().split('T')[0]
        }));

        return res.status(200).json({
            success: true,
            users: formattedUsers
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

// Fetch all owners
const getAllOwners = async (req, res) => {
    try {
        await dbConnect();
        
        // Get all owners
        const owners = await UserModel.find({ role: 'owner' })
            .select('fullname email mobile role createdAt')
            .sort({ createdAt: -1 });

        // Get venue counts for each owner
        const ownersWithVenueCount = await Promise.all(owners.map(async (owner) => {
            const venueCount = await VenueModel.countDocuments({ ownerId: owner._id });
            return {
                ...owner.toObject(),
                venueCount,
                joinedDate: owner.createdAt.toISOString().split('T')[0]
            };
        }));

        return res.status(200).json({
            success: true,
            owners: ownersWithVenueCount
        });
    } catch (error) {
        console.error("Error fetching owners:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch owners",
            error: error.message
        });
    }
};

// Change Venue Status
const changeVenueStatus = async (req, res) => {
    try {
        const { venueId } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['accepted', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Status must be one of: accepted, rejected, pending"
            });
        }

        await dbConnect();
        const venue = await VenueModel.findById(venueId);

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: "Venue not found"
            });
        }

        // Update status
        venue.status = status;
        await venue.save();

        return res.status(200).json({
            success: true,
            message: `Venue status updated to ${status} successfully`,
            venue
        });
    } catch (error) {
        console.error("Error changing venue status:", error);
        return res.status(500).json({
            success: false,
            message: "Error changing venue status",
            error: error.message
        });
    }
};
// Toggle user status
// const toggleUserStatus = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         await dbConnect();

//         const user = await UserModel.findById(userId);
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         user.status = user.status === 'active' ? 'blocked' : 'active';
//         await user.save();

//         return res.status(200).json({
//             success: true,
//             message: `User ${user.status} successfully`,
//             user
//         });
//     } catch (error) {
//         console.error("Error toggling user status:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to toggle user status",
//             error: error.message
//         });
//     }
// };

// Toggle owner status
// const toggleOwnerStatus = async (req, res) => {
//     try {
//         const { ownerId } = req.params;
//         await dbConnect();

//         const owner = await UserModel.findById(ownerId);
//         if (!owner) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Owner not found"
//             });
//         }

//         owner.status = owner.status === 'active' ? 'blocked' : 'active';
//         await owner.save();

//         return res.status(200).json({
//             success: true,
//             message: `Owner ${owner.status} successfully`,
//             owner
//         });
//     } catch (error) {
//         console.error("Error toggling owner status:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to toggle owner status",
//             error: error.message
//         });
//     }
// };

// Fetch pending venues
const getPendingVenues = async (req, res) => {
    try {
        await dbConnect();
        
        // Get all pending venues with owner details
        const pendingVenues = await VenueModel.find({ status: 'pending' })
            .populate('ownerId', 'fullname email mobile')
            .sort({ createdAt: -1 });

        // Format the response
        const formattedVenues = pendingVenues.map(venue => ({
            _id: venue._id,
            name: venue.name,
            type: venue.type,
            address: venue.address,
            city: venue.city,
            owner: {
                name: venue.ownerId.fullname,
                email: venue.ownerId.email,
                phone: venue.ownerId.mobile || 'N/A'
            },
            photos: venue.photos,
            bookingPay: venue.bookingPay,
            rooms: venue.rooms ,
            halls: venue.halls,
            submittedAt: venue.createdAt.toISOString().split('T')[0],
            status: venue.status
        }));

        return res.status(200).json({
            success: true,
            message: "Pending venues fetched successfully",
            venues: formattedVenues
        });
    } catch (error) {
        console.error("Error fetching pending venues:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch pending venues",
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    getAllOwners,
    changeVenueStatus,
    getPendingVenues
    // toggleUserStatus,
    // toggleOwnerStatus
}; 