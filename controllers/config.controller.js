const { ConfigModel } = require('../models/config.model');
const { VenueModel } = require('../models/venue.model');
const { dbConnect } = require('../config/db.config');


// Get all configuration data
const getConfig = async (req, res) => {
    try {
        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            // Create default config if none exists
            const defaultConfig = new ConfigModel({
                venueTypes: [],
                eventTypes: [],
                cities: [],
                featuredVenues: [],
                amenities: []
            });
            
            await defaultConfig.save();
            
            return res.status(200).json({
                success: true,
                message: "Default configuration created",
                config: defaultConfig
            });
        }
        return res.status(200).json({
            success: true,
            message: "Configuration fetched successfully",
            config
        });
    } catch (error) {
        console.error("Error fetching configuration:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching configuration",
            error: error.message
        });
    }
};

// Update entire configuration
const updateConfig = async (req, res) => {
    try {
        const { venueTypes, eventTypes, cities, featuredVenues, amenities } = req.body;
        
        await dbConnect();
        let config = await ConfigModel.findOne();
        
        if (!config) {
            // Create a new config if it doesn't exist
            config = new ConfigModel({
                venueTypes: [],
                eventTypes: [],
                cities: [],
                featuredVenues: [],
                amenities: []
            });
        }
        
        // Update with new data
        if (venueTypes) config.venueTypes = venueTypes;
        if (eventTypes) config.eventTypes = eventTypes;
        if (cities) config.cities = cities;
        if (featuredVenues) config.featuredVenues = featuredVenues;
        if (amenities) config.amenities = amenities;
        
        await config.save();
        
        // Populate venue details before sending response
        const populatedConfig = await ConfigModel.findById(config._id).populate({
            path: 'featuredVenues',
            select: 'name city type'
        });
        
        return res.status(200).json({
            success: true,
            message: "Configuration updated successfully",
            config: populatedConfig
        });
    } catch (error) {
        console.error("Error updating configuration:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating configuration",
            error: error.message
        });
    }
};

// Get featured venues with full details
const getFeaturedVenues = async (req, res) => {
    try {
        await dbConnect();
        
        // Get config to find featured venue IDs
        const config = await ConfigModel.findOne();
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        // Get full venue details for featured venues
        const venues = await VenueModel.find({
            _id: { $in: config.featuredVenues },
            status: 'accepted' // Only get accepted venues
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            venues
        });
    } catch (error) {
        console.error("Error fetching featured venues:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching featured venues",
            error: error.message
        });
    }
};

module.exports = {
    getConfig,
    updateConfig,
    getFeaturedVenues
}; 