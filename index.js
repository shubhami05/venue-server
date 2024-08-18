const express = require("express")
const cors = require("cors")
const session = require("express-session");
const { userRouter } = require("./routes/user.routes");
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
    name:'userSession',
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}))


app.use("/api/user",userRouter)


app.listen(PORT, () => {
    console.log("Server started on port: ", PORT);
})