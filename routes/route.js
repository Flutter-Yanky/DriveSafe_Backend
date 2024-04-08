const express = require("express");
const router = express.Router();    

const {Signin,Signup} = require("../controllers/Auth");
const {userInfo} = require('../controllers/userinfo')

const {DlUpload} = require('../controllers/dl')
const {RCUpload} =  require("../controllers/rc");
const {PUCUpload} =  require("../controllers/puc");
const {INSURUpload} =  require("../controllers/insur");

const { Fine } = require("../controllers/Fine");
const { auth , isOfficer } = require("../middleware/auth");
const {FineCollectionByUserId} = require("../controllers/fineColl");
const { FineUser } = require("../controllers/fineUser");



router.post("/login", Signin);
router.post("/signup", Signup);
router.get("/userinfo/:id",userInfo)
router.post("/upload_dl",auth,DlUpload)
router.post("/upload_rc",auth,RCUpload)
router.post("/upload_puc",auth,PUCUpload)
router.post("/upload_insur",auth,INSURUpload)
router.get("/finecollection/:id",FineCollectionByUserId);


// For Officer
router.get("/fine/:id",auth,isOfficer,Fine)
router.post("/fineuser/:id",auth,isOfficer,FineUser)


module.exports = router; 