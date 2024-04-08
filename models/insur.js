const mongoose = require("mongoose");

const InsurSchema = new mongoose.Schema(
    {
        insur_policy_number:{
            type: String,
            required: true,
        },
        insur_from:{
            type: Date,  
            required : true,
        },
        insur_to:{
            type: Date,
            required : true,
        },
        insur_issued_name:{
            type: String,
            required:true,
        },
        insur_address:{
            type : String,
            required : true
        }
    }
)


module.exports = mongoose.model("InsurSchema",InsurSchema);