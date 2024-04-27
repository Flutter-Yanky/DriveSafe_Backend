const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const schedule = require('node-schedule');


const RTO_DL_schema = require("../models/dlrto")
const RTO_INSUR_Schema = require("../models/insurrto")
const RTO_RC_schema = require("../models/rcrto")
const RTO_PUC_Schema = require("../models/pucrto")
require("dotenv").config();

const checkExpiryOfUser = async(userId) => {
    const userInfo = await User.findById({_id : userId});


    const dl_id = userInfo.user_dl_status['value'];
    const puc_id = userInfo.user_puc_status['value'];
    const rc_id = userInfo.user_rc_status['value'];
    const insur_id  = userInfo.user_insur_status['value'];

    // // db call

    const dl_Data = await RTO_DL_schema.find({ dl_no : dl_id });

    console.log(dl_Data);
    
    const puc_Data = await RTO_PUC_Schema.find({ rto_puc_certificate_No: puc_id});
    
    console.log(puc_Data);

    const rc_Data = await RTO_RC_schema.find({ rc_registered_no : rc_id});
    
    console.log(rc_Data);

    const insur_Data = await RTO_INSUR_Schema.find({ rto_insur_policy_number: insur_id});

    console.log(insur_Data);

    const TodaysDate = new Date();

    console.log(TodaysDate);

    if(dl_Data.length == 0) {
        await User.updateOne({ _id: userId }, {
            $push: {
                notification: "Driving license is not uploaded yet please upload the document"
            }
        },
            { multi: true },
        )
    }
    else if(dl_Data.length == 0 && dl_Data[0].dl_valid_till < TodaysDate){
        await User.updateOne({ _id: userId }, {
            $push: {
                notification: "Driving license is expired, please update the document"
            }
        },
            { multi: true },
        )
    }

    if(rc_Data.length == 0) {
        await User.updateOne({ _id: userId }, {
            $push: {
                notification: "Rc book is not uploaded yet please upload the document"
            }
        },
            { multi: true },
        )
    }
    else if(rc_Data.length == 0 && rc_Data[0].rc_registered_validity < TodaysDate){
        await User.updateOne({ _id: userId }, {
            $push: {
                notification: "Rc book is expired, please update the document"
            }
        },
            { multi: true },
        )
    }

    if(puc_Data.length == 0){
        await User.updateOne({ _id: userId }, {
            $push: {
                notification: "P.U.C. is not uploaded yet please upload the document"
            }
        },
            { multi: true },
        )
    }
    else if(puc_Data.length == 0 && puc_Data[0].rto_puc_validity < TodaysDate){
        await User.updateOne({ _id: userId }, {
            $push: {
                notification: "P.U.C. is expired, please update the document"
            }
        },
            { multi: true },
        )
    }

    if(insur_Data.length == 0  ){
        await User.updateOne({ _id: userId }, {
            $push: {
                notification: "Insurrance is not uploaded yet please upload the document."
            }
        },
            { multi: true },
        )
    }else if(insur_Data.length == 0 && insur_Data[0].rto_insur_to < TodaysDate){
       
        await User.updateOne({ _id: userId }, {
            $push: {
                notification: "Insurrance is expired, please update the document"
            }
        },
            { multi: true },
        )
    }

}

exports.Signin = async (req, res) => {

    try {
        //data fetch
        const { user_email, user_password, role } = req.body;
        //validation on email and password

        if (!user_email || !user_password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please fill all the details carefully',
            });
        }


        //check for registered user
        let user = await User.findOne({ user_email });

        if (user.role != role) {
            return res.status(401).json({
                success: false,
                message: 'User is not exist with this role',
            });
        }

        //if not a registered user
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User is not registered',
            });
        }

        const userId = user._id;

        const payload = {
            email: user.email,
            id: user._id,
            role: user.role
        };

        //verify password & generate a JWT token
        if (await bcrypt.compare(user_password, user.user_password)) {
            //password match
            let token = jwt.sign(payload,
                process.env.JWT_SECRET_KEY,
                {
                    expiresIn: "2h",
                });

            user = user.toObject();
            user.token = token;
            user.user_password = undefined;

            await User.updateOne({ _id: user._id }, {
                $set: {
                    'token': token,
                }
            },
                { multi: true },
            )


            // check for notifications
            const ch = checkExpiryOfUser(userId);

            // 

            res.cookie("user_id", userId, {
                expires: new Date(Date.now() + 60 * 60 * 1000),
                httpOnly: false,
                sameSite: 'Lax',
            })


            res.status(200).json({
                success: true,
                data: {
                    id: user._id,
                    name: user.user_name,
                    token: token,
                    role: user.role
                },
                message: "Cookie set Succcessfully"
            })

        }
        else {
            //passwsord do not match
            return res.status(403).json({
                success: false,
                message: "Password Incorrect",
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Login Failure',
        });
    }
}

exports.Signup = async (req, res) => {
    try {
        //get data
        const { user_name, user_email, user_password, user_mobileNo, role } = req.body;
        //check if user already exist
        const existingUser = await User.findOne({ user_email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already Exists',
            });
        }

        //secure password
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(user_password, 10);
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: 'Error in hashing Password',
            });
        }

        //create entry for User
        const user = await User.create({
            user_name, user_email, user_password: hashedPassword, user_mobileNo, role
        })


        return res.status(200).json({
            success: true,
            message: 'User Created Successfully',
        });

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'User cannot be registered, please try again later',
        });
    }
}
