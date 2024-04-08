const User = require("../models/user");

exports.userInfo = async(req,res)=>{

    const id = req.params.id;
    try{
        const user = await User.find({_id:id});

        const array = Object.values(user);
        
        //sending data to server
        res.send({ array });
        
    }catch(err){
        console.error(err);
        return res.status(500).json({
            success:false,
            message:'error while reading user info',
        });
    }
}