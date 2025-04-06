require('dotenv').config();
const mongoose = require('mongoose');

async function seedConfig() {
  try {
    // Get MongoDB URI from environment variables
    const MONGODB_URI = process.env.MONGODB_URI;
    console.log(`Connecting to: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to database');
    
    // Import the ConfigModel after setting up the connection
    const { Schema } = mongoose;

    // Define the ConfigSchema directly
    const ConfigSchema = new Schema({
      venueTypes: [{
        type: String
      }],
      eventTypes: [{
        type: String
      }],
      cities: [{
        type: String
      }],
      featuredVenues: [{
        type: Schema.Types.ObjectId,
        ref: "Venue"
      }],
      amenities: [{
        type: String
      }]
    });

    // Create the model
    const ConfigModel = mongoose.models.Config || mongoose.model("Config", ConfigSchema);
    
    // Clear existing config
    await ConfigModel.deleteMany({});
    console.log('Deleted existing configurations');
    
    // Create new config
    const config = new ConfigModel({
      venueTypes: ['Hotel', 'Banquet Hall', 'Conference Center', 'Garden', 'Beach Venue'],
      eventTypes: ['Wedding', 'Corporate Event', 'Birthday Party', 'Conference', 'Seminar'],
      cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'],
      amenities: ['WiFi', 'Parking', 'Air Conditioning', 'Catering', 'Sound System', 'Projector']
    });
    
    await config.save();
    console.log('Configuration created successfully!');
    
    // Verify the saved config
    const savedConfig = await ConfigModel.findOne();
    console.log('Saved configuration:');
    console.log(JSON.stringify(savedConfig, null, 2));
    
  } catch (err) {
    console.error('Error seeding configuration:', err);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedConfig(); 