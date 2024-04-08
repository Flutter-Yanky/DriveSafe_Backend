const PUCSchema = require("../models/puc");
const mindee = require("mindee");
const RTO_RC_schema = require("../models/rcrto");
const RTO_PUC_Schema = require("../models/pucrto");
const user = require("../models/user");
const fs = require('fs');

function checkFakeDoc(userObj, orgObj) {

  console.log(orgObj[0]);

  console.log(userObj.puc_certificate_No.trim(),orgObj[0].rto_puc_certificate_No.trim());
  console.log(userObj.puc_registration_No.trim(),orgObj[0].rto_puc_registration_No.trim());
  console.log(userObj.puc_emission_norms.trim(),orgObj[0].rto_puc_emission_norms.trim());

  if (userObj.puc_certificate_No.trim() === orgObj[0].rto_puc_certificate_No.trim()
    && userObj.puc_registration_No.trim() === orgObj[0].rto_puc_registration_No.trim()
  && userObj.puc_emission_norms.trim() === orgObj[0].rto_puc_emission_norms.trim()  
  ){ 
      
      // dates checking for registered_date in rc book 
      let date = new Date(orgObj[0].rto_puc_date);

      // Extract the date components
      let year = date.getFullYear();
      let month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
      let day = date.getDate().toString().padStart(2, '0');

      // Construct the desired format
      let formattedDate = `${year}-${month}-${day}`;

      const date1 = new Date(userObj.puc_date);
      const date2 = new Date(formattedDate);


      // dates checking for  registered_validity in rc book 
      date = new Date(orgObj.rto_puc_validity);

      // Extract the date components
      year = date.getFullYear();
      month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
      day = date.getDate().toString().padStart(2, '0');

      formattedDate = `${year}-${month}-${day}`;

      const date3 = new Date(userObj.puc_validity);
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

exports.PUCUpload = async (req, res) => {
  let userPucObj = {}
  try {

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

    const inputSource = mindeeClient.docFromPath(path);

    const customEndpoint = mindeeClient.createEndpoint(
      "puc_2",
      "Shruti-Deshmane",
      "1" // Defaults to "1"
    );

    const asyncApiResponse = mindeeClient.enqueueAndParse(
      mindee.product.GeneratedV1,
      inputSource,
      { endpoint: customEndpoint }
    );

    // Handle the response Promise
    asyncApiResponse.then((resp) => {
      // print a string summary

      userPucObj = {
        puc_fuel: resp.document.inference.prediction.fields.get('fuel').value,
        puc_date: resp.document.inference.prediction.fields.get('date').value,
        puc_validity: resp.document.inference.prediction.fields.get('validity').value,
        puc_certificate_No: resp.document.inference.prediction.fields.get('certificate_no').value,
        puc_registration_No: resp.document.inference.prediction.fields.get('registration_no').value,
        puc_emission_norms: resp.document.inference.prediction.fields.get('emission_norms').value,
        puc_code: resp.document.inference.prediction.fields.get('puc_code').value
      }

      fs.unlinkSync(path);

    })
      .then(async () => {

       

        const checkuser = await RTO_RC_schema.find({ rc_registered_no : userPucObj['puc_registration_No'] });
        console.log(checkuser);

        console.log(userPucObj['puc_registration_No']);


        if (isObjectEmpty(checkuser)) {
          return res.status(400).json({
            success: false,
            message: 'uploaded document is not present in Rto database.',
          });
        }else{

          if (checkuser[0].rc_registered_no != userPucObj['puc_registration_No']) {
            return res.status(400).json({
              success: false,
              message: "puc is not matching with rc book vehicle number"
            })
          } 

          const dataUser = await RTO_PUC_Schema.find({ rto_puc_certificate_No: userPucObj['puc_certificate_No'] });

          console.log(dataUser);

          const status = checkFakeDoc(userPucObj,dataUser);
          if (!status) {
            return res.status(400).json({
              success: false,
              message: 'it is a fake document',
            });
          }else {

              const puc_data = await PUCSchema.create(userPucObj);

              // upadte the global document variables
              
              await user.findByIdAndUpdate({ _id: req.user.id }, {
             
                $set: {
                  'user_puc_status.status': true,
                  'user_puc_status.value': userPucObj['puc_certificate_No']
                }
              }, { multi: true },
              
              ).then(() => {

                console.log("data changed");
              })


              return res.status(200).json({
                success: true,
                data: puc_data,
                message: 'Puc added successfully',
              });

            }
          

        }
          
      })
  }
  catch (err) {
    return res.status(400).json({
      success: false,
      message: "Error occured due to some technical issue"
    })
  }
}