const nodemailer = require('nodemailer')


exports.contactUS = async(req,res) =>{
  
    try{
        const data = req.body;      
       
        // transpoter
        let transpoter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        })

        //send mail
        let info = await transpoter.sendMail({
            from : data.email,
            to : `sagarpatil98754@gmail.com`,
            subject : `Contact from ${data.firstName} ${data.lastName}`,
            html : `<h2>Hello sir,</h2>
                <p> i am ${data.firstName} ${data.lastName} and i am contact you regarding to this issue.</p>
                <p>${data.message}</p> 
                <p>Email : ${data.email} </p>
                <p>Mobile number : ${data.phone_number}</p>
            <p>Thank You</p>`,
        })

        return res.status(200).json({
            success : true,
            info : info,
            message : "mail send successfully",
        })

    }catch(err){
        console.log(err);
        return res.status(400).json({
            success : false,
            message: err.message,
        })
    }
}