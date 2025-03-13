const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const { authRouter } = require("./routes/auth.routes");
const { userRouter } = require("./routes/user.routes");
const { ownerRouter } = require("./routes/owner.routes");
const { adminRouter } = require("./routes/admin.routes");
require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URI,
].filter(Boolean); // Filter out undefined values

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(cookieParser(process.env.COOKIE_SECRET || process.env.SECRET_KEY));

// Add a test route to check CORS
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/owner",ownerRouter);
app.use("/api/admin",adminRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})