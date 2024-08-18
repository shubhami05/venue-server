const express = require("express")
const cors = require("cors")
const session = require("express-session");
const { dbConnect } = require("./config/db.config");
require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
    origin: [process.env.USERPANEL_PORT, process.env.OWNERPANEL_PORT, process.env.ADMINPANEL_PORT],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true
}))



app.listen(PORT, () => {
    console.log("Server started on port: ", PORT);
})