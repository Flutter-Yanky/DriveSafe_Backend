const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        user_name:{
            type: String,
            maxLength : 100,
        },
        user_email:{
            type: String,  
            required : true,
            unique : true,
        },
        user_password:{
            type: String,
            required : true,
        },
        user_mobileNo:{
            type:String,
        },
        user_dl_status:{
            type : Object,
            default : {status : false , value : ""}
        },
        user_rc_status :{
            type : Object,
            default : {status : false , value : ""}
        },
        user_puc_status:{
            type : Object,
            default : {status : false , value : ""}
        },
        user_insur_status :{
            type : Object,
            default : {status : false , value : ""}
        },
        user_about:{
            type : String,  
            default : "To get social media testimonials like these, keep your customers engaged with your social media accounts by posting regularly yourself"
        },
        user_qr_status:{
            type : Boolean,
            default : false
        },
        user_createdAt:{
            type: Date,
            default: Date.now(),
            required : true,
        },
        fine_history:[
            {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Fine"
            }
        ],
        fine_today:{
            type : Boolean,
            default : false,
            required : true
        },
        role:{
            type:String,
            required : true,
            enum:["user", "officer",]
        },
        token:{
            type:String,
        }
    }
)

module.exports = mongoose.model("User",userSchema);