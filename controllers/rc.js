const RcSchema = require("../models/rc");
const mindee = require("mindee");
const RTO_RC_schema = require("../models/rcrto");
const user = require("../models/user");
const fs = require('fs');
const isSubstring = (string1, string2) => {
    const cleanString1 = string1.toLowerCase().replace(/\s+/g, '');
    const words = string2.toLowerCase().split(/\s+/).filter(Boolean); // Split string2 into words
    return words.some(word => cleanString1.includes(word));
}


function checkFakeDoc(userObj, orgObj) {

   
    const check1 = isSubstring(orgObj[0].rc_autority,userObj.authority);

    const check2 = isSubstring(userObj.name,orgObj[0].rc_user_name)

    if (check1 && userObj.chassis_no.trim() === orgObj[0].rc_chassis_no.trim() && 
        userObj.engine_no.trim() === orgObj[0].rc_engine_no.trim() && 
        check2 && userObj.registered_no.trim() === orgObj[0].rc_registered_no.trim()){
        

        // dates checking for registered_date in rc book 
        let date = new Date(orgObj[0].rc_registered_date);

        // Extract the date components
        let year = date.getFullYear();
        let month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
        let day = date.getDate().toString().padStart(2, '0');

        // Construct the desired format
        let formattedDate = `${year}-${month}-${day}`;

        const date1 = new Date(userObj.registered_date);
        const date2 = new Date(formattedDate);


        // dates checking for  registered_validity in rc book 
        date = new Date(orgObj.rc_registered_validity);

        // Extract the date components
        year = date.getFullYear();
        month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
        day = date.getDate().toString().padStart(2, '0');

        formattedDate = `${year}-${month}-${day}`;

        const date3 = new Date(userObj.registered_date);
        const date4 = new Date(formattedDate);


        if(date1.getTime() !== date2.getTime() && date3.getTime() !== date4.getTime()){
            return false;
        }
        return true; 
    }else{
        return false;
    }
}

function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}

exports.RCUpload = async (req, res) => {
    try {

        let userObj;
        const document = req.files.document
        if (!document) {
            return res.status(400).json({
                success: false,
                message: 'image not found',
            });
        }

        let path = __dirname + "/uploads/" + Date.now() + `.${document.name.split('.')[1]}`;
        document.mv(path, (err) => {
            if (err) {
                console.log(err);
            }
        });

        // mindee api
        const mindeeClient = new mindee.Client({ apiKey: process.env.MINDEE_APIKEY });

        const inputSource = mindeeClient.docFromPath(path);
        if (!inputSource) {
            return res.status(400).json({
                success: false,
                message: 'image not found',
            });
        }

        const customEndpoint = mindeeClient.createEndpoint("rc", "Shruti-Deshmane");

        const apiResponse = mindeeClient.parse(mindee.product.CustomV1, inputSource, { endpoint: customEndpoint, cropper: true });

        apiResponse.then((resp) => {
            let rc_autority = "";
            for (let i = 0; i < resp.document.inference.prediction.fields.get('authority').values.length; i++) {
                if (resp.document.inference.prediction.fields.get('authority').values[i].content != ":" && resp.document.inference.prediction.fields.get('authority').values[i].content != "undefined") {
                    rc_autority += resp.document.inference.prediction.fields.get('authority').values[i].content + " ";
                }
            }

            let Name = "";
            for (let i = 0; i < resp.document.inference.prediction.fields.get('name').values.length; i++) {
                if (resp.document.inference.prediction.fields.get('name').values[i].content != ":" && resp.document.inference.prediction.fields.get('name').values[i].content != "name ") {
                    Name += resp.document.inference.prediction.fields.get('name').values[i].content + " ";
                }
            }

            // step 2: create the user Object
            userObj = {
                authority: rc_autority,
                chassis_no: resp.document.inference.prediction.fields.get('chassis_no').values[0].content,
                name: Name,
                engine_no: resp.document.inference.prediction.fields.get('engine_no').values[0].content,
                registered_no: resp.document.inference.prediction.fields.get('registered_no').values[0].content,
                registered_date: resp.document.inference.prediction.fields.get('registered_date').values[0].content,
                registered_validity: resp.document.inference.prediction.fields.get('registered_validity').values[0].content
            }

            fs.unlinkSync(path);
        })
            .then(async () => {

                const CurrentUser = await user.findById({ _id: req.user.id });
                const checkuser = await RTO_RC_schema.find({ rc_registered_no : userObj['registered_no'] });

                 // check data is valid or not (empty or null)
                if (isObjectEmpty(checkuser)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Data for this entry is not valid means falutly data or fake document',
                    });
                }

                // checking for fake document
                const status = checkFakeDoc(userObj, checkuser);
                if (!status) {
                    return res.status(400).json({
                        success: false,
                        message: 'it is a fake document',
                    });
                } else {


                    // check user is logged in or not
                    if (req.user.id === undefined) {
                        return res.status(400).json({
                            success: false,
                            message: 'User is not logged in or token expired',
                        });
                    }

                    const result = isSubstring(CurrentUser.user_name.toLowerCase().trim(),userObj.name.toLowerCase().trim())

                    if(result){

                        const rc_autority = userObj['authority'];
                        const rc_chassis_no = userObj['chassis_no'];
                        const rc_engine_no = userObj['engine_no'];
                        const rc_user_name = userObj['name'];
                        const rc_registered_no = userObj['registered_no'];
                        const rc_registered_date = userObj['registered_date'];
                        const rc_registered_validity = userObj['registered_validity'];

                        const rc_data = await RcSchema.create({
                            rc_autority,
                            rc_chassis_no,
                            rc_engine_no,
                            rc_user_name,
                            rc_registered_no,
                            rc_registered_date,
                            rc_registered_validity,
                        })

                        console.log("data stored");


                        // change the user status
                        const updatedUser =  await user.findByIdAndUpdate({ _id: req.user.id }, {
                            $set: {
                                'user_rc_status.status': true,
                                'user_rc_status.value': userObj.registered_no
                            }
                        },
                            { multi: true },
                        ).then(() => {
                            console.log("data changed");
                        })
                    }else{
                        return res.status(400).json({
                            success:false,
                            message:"uploaded doucment is not match with current user"
                        })
                    }
                
                }

                return res.status(200).json({
                    success: true,
                    message: 'rc Licnese data fetch successfully',
                });
            })

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: 'Error occured due to technical reason',
        });
    }
}