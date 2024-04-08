const mongoose = require("mongoose");

const RTO_INSUR_Schema = new mongoose.Schema(
    {
        rto_insur_policy_number:{
            type: String,
            required: true,
        },
        rto_insur_from:{
            type: Date,  
            required : true,
        },
        rto_insur_to:{
            type: Date,
            required : true,
        },
        rto_insur_issued_name:{
            type: String,
            required:true,
        },
        rto_insur_registration_no:{
            type : String,
            required : true
        },
        rto_insur_policy_status:{
            type : String,
            required : true
        }
    }
)


module.exports = mongoose.model("RTO_INSUR_Schema",RTO_INSUR_Schema);