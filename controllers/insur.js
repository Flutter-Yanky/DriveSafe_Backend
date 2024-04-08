const InsurSchema = require("../models/insur");
const mindee = require("mindee");
const RTO_RC_schema = require("../models/rcrto");
const RTO_INSUR_Schema = require("../models/insurrto");
const user = require("../models/user");
const fs = require('fs');

function checkFakeDoc(userObj, orgObj) {

    console.log(orgObj[0]);
  
    // console.log(userObj.insur_policy_number.trim(),orgObj[0].rto_puc_certificate_No.trim());
    // console.log(userObj.insur_issued_name.trim(),orgObj[0].rto_puc_registration_No.trim());
    // console.log(userObj.insur_registration_no.trim(),orgObj[0].rto_puc_emission_norms.trim());
  
    if (userObj.insur_policy_number.trim() === orgObj[0].rto_insur_policy_number.trim()
      && userObj.insur_issued_name.trim() === orgObj[0].rto_insur_issued_name.trim()
    && userObj.insur_registration_no.trim() === orgObj[0].rto_insur_registration_no.trim()  
    && userObj.insur_policy_status.trim() === orgObj[0].rto_insur_policy_status.trim()
    ){ 
        
        // dates checking for registered_date in rc book 
        let date = new Date(orgObj[0].rto_insur_to);
  
        // Extract the date components
        let year = date.getFullYear();
        let month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
        let day = date.getDate().toString().padStart(2, '0');
  
        // Construct the desired format
        let formattedDate = `${year}-${month}-${day}`;
  
        const date1 = new Date(userObj.insur_to);
        const date2 = new Date(formattedDate);
  
  
        // dates checking for  registered_validity in rc book 
        date = new Date(orgObj.rto_insur_from);
  
        // Extract the date components
        year = date.getFullYear();
        month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
        day = date.getDate().toString().padStart(2, '0');
  
        formattedDate = `${year}-${month}-${day}`;
  
        const date3 = new Date(userObj.insur_from);
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


exports.INSURUpload = async (req, res) => {
    let userInsurObj = {}
    try {

        console.log("Working...");
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

        const mindeeClient = new mindee.Client({ apiKey: process.env.MINDEE_APIKEY });

        // Load a file from disk
        const inputSource = mindeeClient.docFromPath(path);

        // Create a custom endpoint for your product
        const customEndpoint = mindeeClient.createEndpoint(
            "insurance_1",
            "Shruti-Deshmane",
            "1" // Defaults to "1"
        );

        // Parse the file asynchronously.
        const asyncApiResponse = mindeeClient.enqueueAndParse(
            mindee.product.GeneratedV1,
            inputSource,
            { endpoint: customEndpoint }
        );


        // Handle the response Promise
        asyncApiResponse.then((resp) => {

            userInsurObj = {
                insur_policy_number: resp.document.inference.prediction.fields.get('policy_number').value,
                insur_from: resp.document.inference.prediction.fields.get('from').value,
                insur_to: resp.document.inference.prediction.fields.get('to').value,
                insur_issued_name: resp.document.inference.prediction.fields.get('issued_name').value,
                insur_registration_no: resp.document.inference.prediction.fields.get('registration_no').value,
                insur_policy_status: resp.document.inference.prediction.fields.get('policy_status').value
            }

            fs.unlinkSync(path);

        }).then(async () => {

            const checkuser = await RTO_RC_schema.find({ rc_registered_no: userInsurObj['insur_registration_no'] });

            console.log(checkuser);
            console.log(userInsurObj['insur_registration_no']);

            if (isObjectEmpty(checkuser)) {
                return res.status(400).json({
                    success: false,
                    message: 'uploaded document is not present in Rto database.',
                });
            } else {

                if (checkuser[0].rc_registered_no != userInsurObj['insur_registration_no']) {
                    return res.status(400).json({
                        success: false,
                        message: "puc is not matching with rc book vehicle number"
                    })
                }

                const dataUser = await RTO_INSUR_Schema.find({ insur_policy_number: userPucObj['policy_number'] });

                const status = checkFakeDoc(userPucObj, dataUser);
                if (!status) {
                    return res.status(400).json({
                        success: false,
                        message: 'it is a fake document',
                    });
                } else {

                    const insur_data = await InsurSchema.create(userInsurObj)

                    await user.findByIdAndUpdate({ _id: req.user.id }, {

                        $set: {
                            'user_insur_status.status': true,
                            'user_insur_status.value': userInsurObj['policy_number']
                        }
                    }, { multi: true },

                    ).then(() => {
                        console.log("data changed");
                    })

                    return res.status(200).json({
                        success: true,
                        data: insur_data,
                        message: 'insur added rto_insur successfully',
                    });
                }
            }
        })



    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "Error occured due to some technical issue"
        })
    }
}