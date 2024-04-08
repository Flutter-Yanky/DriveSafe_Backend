const mongoose = require("mongoose");

const RTO_RC_schema = new mongoose.Schema(
    {
        rc_autority:{
            type: String,
            required: true,
        },
        rc_chassis_no:{
            type: String,  
            required : true,
        },
        rc_engine_no:{
            type: String,
            required : true,
        },
        rc_user_name:{
            type: String,
            required:true,
        },
        rc_registered_no:{
            type : String,
            required : true
        },
        rc_registered_date:{
            type: Date,
            required : true
        },
        rc_registered_validity:{
            type:Date,
            required : true
        },
        rc_createdAt:{
            type: Date,
            default: Date.now(),
            required : true,
        }
    }
)

module.exports = mongoose.model("RTO_RC",RTO_RC_schema);