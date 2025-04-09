const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const multer = require('multer');
const { authRouter } = require("./routes/auth.routes");
const { userRouter } = require("./routes/user.routes");
const { ownerRouter } = require("./routes/owner.routes");
const { adminRouter } = require("./routes/admin.routes");
const stripeRouter = require("./routes/stripe.routes");
require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.json({ message: 'Backend is working!' });
});
// Special handling for Stripe webhooks - must be raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
// Regular middleware for all other routes
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// Define allowed origins
// const allowedOrigins = [
//   'https://venueserv.vercel.app',
//   process.env.FRONTEND_URI,
// ];

// Configure CORS
app.use(cors());

app.use(cookieParser(process.env.COOKIE_SECRET));

// const upload = multer({
//   limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
//   fileFilter: (req, file, cb) => {
//     // ...existing code...
//   }
// });

// app.post('/upload', upload.fields([{ name: 'images', maxCount: 10 }]), (req, res) => {
//   // ...existing code...
//   res.send('Files uploaded successfully');
// });

// Add a test route to check CORS
app.get('/api/test-cors', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/stripe", stripeRouter);

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