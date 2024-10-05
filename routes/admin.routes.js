const express = require("express")
const adminRouter = express.Router();

adminRouter.get("/user/fetch");
adminRouter.get("/user/fetch/:id");
adminRouter.put("/user/change-role");
// adminRouter.get("/user/delete/:id");

adminRouter.get("/venue/fetch");
adminRouter.get("/venue/fetch/:id");

adminRouter.get("/review/fetch");

adminRouter.get("/booking/fetch");

adminRouter.get("/contact/fetch");
adminRouter.post("/contact/reply"); //TODO: EMAIL INTERGRATION

module.exports = {adminRouter};