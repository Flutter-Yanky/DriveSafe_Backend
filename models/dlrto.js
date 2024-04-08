const mongoose = require("mongoose");

const RTO_DL_schema = new mongoose.Schema(
    {
        dl_no:{
            type: String,
            unique : true,
            required: true,
        },
        dl_cov:{
            type: Array,  
            required : true,
        },
        dl_name:{
            type: String,
            required : true,
        },
        dl_state:{
            type:String,
            required:true,
        },
        dl_valid_till:{
            type: Date,
            required : true
        },
        dl_createdAt:{
            type: Date,
            default: Date.now(),
            required : true,
        }
    }
)

module.exports = mongoose.model("RTO_DL",RTO_DL_schema);