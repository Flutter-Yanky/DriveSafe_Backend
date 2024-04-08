const DLSchema = require("../models/dl");
const mindee = require("mindee");
const RTO_DL_schema = require("../models/dlrto");
const user = require("../models/user");
const fs = require('fs');


function checkFakeDoc(userObj, orgObj) {
    
    // not fake 
    const areEqual = JSON.stringify(userObj.cov) === JSON.stringify(orgObj[0].dl_cov);
    // console.log("array comapre : "+areEqual);


    if (userObj.name.trim() === orgObj[0].dl_name.trim() 
        && areEqual && userObj.state.trim() === orgObj[0].dl_state.trim()
        && userObj.dl_no.trim() === orgObj[0].dl_no.trim()) {

        
            const date = new Date(orgObj[0].dl_valid_till);

            // Extract the date components
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
            const day = date.getDate().toString().padStart(2, '0');

            // Construct the desired format
            const formattedDate = `${year}-${month}-${day}`;

            const date1 = new Date(userObj.valid_till);
            const date2 = new Date(formattedDate);

            if(date1.getTime() !== date2.getTime()){
                return false;
            }

        return true; 
    }
    // fake
    else {
        return false;
    }
}

function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}

exports.DlUpload = async (req, res) => {

    try{

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


        // Api mindee
        const mindeeClient = new mindee.Client({
            apiKey: process.env.MINDEE_APIKEY
        });


        const inputSource = mindeeClient.docFromPath(path);
        if (!inputSource) {
            return res.status(400).json({
                success: false,
                message: 'inputsource is not found',
            });
        }

        const customEndpoint = mindeeClient.createEndpoint("dataset_dl","Shruti-Deshmane");

        // Parse it
        const apiResponse = mindeeClient.parse(mindee.product.CustomV1, inputSource,{
            endpoint: customEndpoint,cropper: true
        });

        apiResponse.then((resp) => {
            // Filtering data
            let Name = "";
            for (let i = 0; i < resp.document.inference.prediction.fields.get('name').values.length; i++) {
                if (resp.document.inference.prediction.fields.get('name').values[i].content != ":" && resp.document.inference.prediction.fields.get('name').values[i].content != "name ") {
                    Name += resp.document.inference.prediction.fields.get('name').values[i].content + " ";
                }
            }

            let cov = []
            for (let i = 0; i < resp.document.inference.prediction.fields.get('cov').values.length; i++) {
                if (resp.document.inference.prediction.fields.get('cov').values[i].content != ":") {
                    cov.push(resp.document.inference.prediction.fields.get('cov').values[i].content)
                }
            }

            // step 2: create the user Object
            userObj = {
                dl_no: "MH" + resp.document.inference.prediction.fields.get('dl_no').values[0].content,
                cov: cov,
                name: Name,
                state: resp.document.inference.prediction.fields.get('state').values[0].content,
                valid_till: resp.document.inference.prediction.fields.get('valid_till').values[0].content
            }

            fs.unlinkSync(path);
        })

        .then(async()=>{
            const CurrentUser = await user.findById({ _id: req.user.id });
            const checkuser = await RTO_DL_schema.find({ dl_no: userObj['dl_no'] });


            // checking for fake document
            const status = checkFakeDoc(userObj, checkuser);

            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'it is a fake document',
                });
            }else{
                //check data name from rto database
            
                if (isObjectEmpty(checkuser)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Data for this entry is not valid means falutly data',
                    });
                }

                // check user is logged in or not
                if (req.user.id === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: 'User is not logged in or token expired',
                    });
                }

                if (CurrentUser.user_name.toLowerCase().trim() === userObj.name.toLowerCase().trim()) {
    
                    // change the user status
                    await user.findByIdAndUpdate({ _id: req.user.id }, {
                        $set: {
                            'user_dl_status.status': true,
                            'user_dl_status.value': userObj.dl_no
                        }
                    },
                        { multi: true },
                    ).then(() => {
                        console.log("data changed");
                    })

                    const updatedUser = await user.findById({ _id: req.user.id });
                    // console.log(updatedUser);

                    // saving data at database
                    const user_dl_no = userObj['dl_no'];
                    const user_dl_name = userObj['name'];
                    const user_dl_state = userObj['state'];
                    const user_dl_cov = userObj['cov'];
                    const user_dl_valid_till = userObj['valid_till'];

                    const user_dl = await DLSchema.create({
                        user_dl_no,
                        user_dl_name,
                        user_dl_cov,
                        user_dl_state,
                        user_dl_valid_till,
                        // user_dl_id:
                    })
                    console.log("data stored");
                    return res.status(200).json({
                        success:true,
                        data : updatedUser,
                        message:"data saved successfully"
                    })
                }
                else{
                    return res.status(400).json({
                        success : false,
                        message : "uploaded doucment is not match with current user"
                    })
                }
            }   
        });
    }catch(err){
        return res.status(400).json({
            success : false,
            message : "Error occured due to some technical issue"
        })
    }
    
}

