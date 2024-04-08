const mongoose = require("mongoose");

const pucSchema = new mongoose.Schema(
    {
        puc_fuel:{
            type: String,
            required: true,
        },
        puc_date:{
            type: Date,  
            required : true,
        },
        puc_validity:{
            type: Date,
            required : true,
        },
        puc_certificate_No:{
            type: String,
            required:true,
        },
        puc_registration_No:{
            type : String,
            required : true
        },
        puc_emission_norms:{
            type: String,
            required : true
        },
        puc_code:{
            type:String,
            required : true
        }
    }
)


module.exports = mongoose.model("PUCSchema",pucSchema);