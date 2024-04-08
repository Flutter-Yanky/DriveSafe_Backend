const mongoose = require("mongoose");

const RTO_PUC_Schema = new mongoose.Schema(
    {
        rto_puc_fuel:{
            type: String,
            required: true,
        },
        rto_puc_date:{
            type: Date,  
            required : true,
        },
        rto_puc_validity:{
            type: Date,
            required : true,
        },
        rto_puc_certificate_No:{
            type: String,
            required:true,
        },
        rto_puc_registration_No:{
            type : String,
            required : true
        },
        rto_puc_emission_norms:{
            type: String,
            required : true
        },
        rto_puc_code:{
            type:String,
            required : true
        }
    }
)


module.exports = mongoose.model("RTO_PUC_SCHEMA",RTO_PUC_Schema);