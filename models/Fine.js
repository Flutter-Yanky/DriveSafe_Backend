const mongoose = require("mongoose")

const FineSchema = new mongoose.Schema({
    fine_dl:{
        type : Number,
        required : true
    },
    fine_rc :{
        type : Number,
        required : true
    },
    fine_puc:{
        type : Number,
        required : true
    },
    fine_insur:{
        type : Number,
        required : true
    },
    fine_total:{
        type : Number,
        required : true
    },
    fined_user:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    fine_status:{
        type : Boolean,  
        default : false,
        required : true,
    },
    fine_createdAt:{
        type: Date,
        default: Date.now(),    
        required : true,
    },
})

module.exports = mongoose.model("Fine",FineSchema);