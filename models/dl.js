const mongoose = require("mongoose");

const dlSchema = new mongoose.Schema(
    {
        user_dl_no:{
            type: String,
            required: true,
        },
        user_dl_cov:{
            type: Array,  
            required : true,
        },
        user_dl_name:{
            type: String,
            required : true,
        },
        user_dl_state:{
            type:String,
            required:true,
        },
        user_dl_valid_till:{
            type: Date,
            required : true
        },
        user_dl_id:{
            type : String,
        },
        user_dl_createdAt:{
            type: Date,
            default: Date.now(),
            required : true,
        }
    }
)

module.exports = mongoose.model("DLSchema",dlSchema);