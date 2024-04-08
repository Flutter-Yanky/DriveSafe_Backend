const User = require("../models/user")
const Fine = require("../models/Fine")

exports.FineCollectionByUserId = async(req,res)=>{

    const id = req.params.id;
    
    try{
        const user = await User.find({_id:id});

        let fine_arr= []

        for(let i=0;i<user[0].fine_history.length;i++){
            let obj = await Fine.findById({_id:user[0].fine_history[i]});
            fine_arr.push(obj);
        }

        return res.status(200).json({
            "data":fine_arr
        })
        
        
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:'error while reading fine info',
        });
    }
}