const { ConfigModel } = require('../models/config.model');
const { dbConnect } = require('../config/db.config');

// Get all configuration data
const getConfig = async (req, res) => {
    try {
        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Configuration fetched successfully",
            data: config
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

// Update venue types
const updateVenueTypes = async (req, res) => {
    try {
        const { venueTypes } = await req.body;
        
        if (!Array.isArray(venueTypes)) {
            return res.status(400).json({
                success: false,
                message: "Venue types must be an array"
            });
        }

        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        config.venueTypes = venueTypes;
        await config.save();

        return res.status(200).json({
            success: true,
            message: "Venue types updated successfully",
            data: config
        });
    } catch (error) {
        console.error("Error updating venue types:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating venue types",
            error: error.message
        });
    }
};

// Update event types
const updateEventTypes = async (req, res) => {
    try {
        const { eventTypes } = req.body;
        
        if (!Array.isArray(eventTypes)) {
            return res.status(400).json({
                success: false,
                message: "Event types must be an array"
            });
        }

        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        config.eventTypes = eventTypes;
        await config.save();

        return res.status(200).json({
            success: true,
            message: "Event types updated successfully",
            data: config
        });
    } catch (error) {
        console.error("Error updating event types:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating event types",
            error: error.message
        });
    }
};

// Update cities
const updateCities = async (req, res) => {
    try {
        const { cities } = req.body;
        
        if (!Array.isArray(cities)) {
            return res.status(400).json({
                success: false,
                message: "Cities must be an array"
            });
        }

        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        config.cities = cities;
        await config.save();

        return res.status(200).json({
            success: true,
            message: "Cities updated successfully",
            data: config
        });
    } catch (error) {
        console.error("Error updating cities:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating cities",
            error: error.message
        });
    }
};

// Update featured venues
const updateFeaturedVenues = async (req, res) => {
    try {
        const { featuredVenues } = req.body;
        
        if (!Array.isArray(featuredVenues)) {
            return res.status(400).json({
                success: false,
                message: "Featured venues must be an array"
            });
        }

        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        config.featuredVenues = featuredVenues;
        await config.save();

        return res.status(200).json({
            success: true,
            message: "Featured venues updated successfully",
            data: config
        });
    } catch (error) {
        console.error("Error updating featured venues:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating featured venues",
            error: error.message
        });
    }
};

// Add a single venue type
const addVenueType = async (req, res) => {
    try {
        const { venueType } = await req.body;
        
        if (!venueType || typeof venueType !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Valid venue type is required"
            });
        }

        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        if (config.venueTypes.includes(venueType)) {
            return res.status(400).json({
                success: false,
                message: "Venue type already exists"
            });
        }

        config.venueTypes.push(venueType);
        await config.save();

        return res.status(200).json({
            success: true,
            message: "Venue type added successfully",
            data: config
        });
    } catch (error) {
        console.error("Error adding venue type:", error);
        return res.status(500).json({
            success: false,
            message: "Error adding venue type",
            error: error.message
        });
    }
};

// Add a single event type
const addEventType = async (req, res) => {
    try {
        const { eventType } = await req.body;
        
        if (!eventType || typeof eventType !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Valid event type is required"
            });
        }

        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        if (config.eventTypes.includes(eventType)) {
            return res.status(400).json({
                success: false,
                message: "Event type already exists"
            });
        }

        config.eventTypes.push(eventType);
        await config.save();

        return res.status(200).json({
            success: true,
            message: "Event type added successfully",
            data: config
        });
    } catch (error) {
        console.error("Error adding event type:", error);
        return res.status(500).json({
            success: false,
            message: "Error adding event type",
            error: error.message
        });
    }
};

// Add a single city
const addCity = async (req, res) => {
    try {
        const { city } = await req.body;
        
        if (!city || typeof city !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Valid city is required"
            });
        }

        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        if (config.cities.includes(city)) {
            return res.status(400).json({
                success: false,
                message: "City already exists"
            });
        }

        config.cities.push(city);
        await config.save();

        return res.status(200).json({
            success: true,
            message: "City added successfully",
            data: config
        });
    } catch (error) {
        console.error("Error adding city:", error);
        return res.status(500).json({
            success: false,
            message: "Error adding city",
            error: error.message
        });
    }
};

// Add a single featured venue
const addFeaturedVenue = async (req, res) => {
    try {
        const { venueId } = await req.body;
        
        if (!venueId) {
            return res.status(400).json({
                success: false,
                message: "Venue ID is required"
            });
        }

        await dbConnect();
        const config = await ConfigModel.findOne();
        
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Configuration not found"
            });
        }

        if (config.featuredVenues.includes(venueId)) {
            return res.status(400).json({
                success: false,
                message: "Venue is already featured"
            });
        }

        config.featuredVenues.push(venueId);
        await config.save();

        return res.status(200).json({
            success: true,
            message: "Featured venue added successfully",
            data: config
        });
    } catch (error) {
        console.error("Error adding featured venue:", error);
        return res.status(500).json({
            success: false,
            message: "Error adding featured venue",
            error: error.message
        });
    }
};

module.exports = {
    getConfig,
    updateVenueTypes,
    updateEventTypes,
    updateCities,
    updateFeaturedVenues,
    addVenueType,
    addEventType,
    addCity,
    addFeaturedVenue
}; 