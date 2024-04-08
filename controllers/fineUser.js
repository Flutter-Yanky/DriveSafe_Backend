const Fine = require("../models/Fine")
const User = require("../models/user")

exports.FineUser = async (req,res)=>{
    
    try{
        const {id} = req.params
        const {fine_dl,fine_rc,fine_puc,fine_insur,fine_total,fine_status,fined_user} = req.body; 

        const savedFine = {
            fine_dl : fine_dl,
            fine_rc : fine_rc,
            fine_puc : fine_puc,
            fine_insur : fine_insur,
            fine_total : fine_total,
            fine_status : fine_status,
            fined_user : id
        }

        const user = await User.findById({_id:id});

        if(fine_total != 0){
            
            const FineToUser = await Fine.create({
                fine_dl, fine_rc, fine_puc, fine_insur,
                fine_status, fine_total, fined_user
            });

            await User.updateOne({_id:user._id},{
                $push : {
                    'fine_history': FineToUser._id,
                }},
                { multi: true },
            )

            await User.updateOne({_id:user._id},{
                $set : {
                    'fine_today': true,
                }},
                { multi: true },
            )
            
        }
        
        return res.status(200).json({
            "success": true,
            "Data": savedFine,
            "message": "Fine Allocation done",
        })

    }catch(err){
        return res.status(400).json({
            success: false,
            err: err
        })
    }
}