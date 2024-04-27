const mongoose = require("mongoose");

const Notification = new mongoose.Schema(
    {
        avatar:{
            type: String,
            required: false,
        },
        title:{
            type: String,
            required : true,
        },
        description:{
            type: String,
            required : true,
        },
    }
)

module.exports = mongoose.model("notifications",Notification);