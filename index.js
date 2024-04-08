const express = require("express"); 
const app = express();
const dbConnect = require("./config/database");
const cors = require("cors");
const cookieParser = require('cookie-parser');
require("dotenv").config();
const bodyParser = require('body-parser');

const corsOptions = {
    origin : "http://localhost:5173",//included origin as true
    credentials: true, //included credentials as true
};

app.use(cookieParser());

const fileupload = require('express-fileupload');

app.use(fileupload({
    useTempFiles:true,
    safeFileNames: true,
    preserveExtension: true,
    tempFileDir:'/tmp/'
}))


app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const PORT = process.env.PORT || 4000;
dbConnect();

app.use(express.json());
app.use(cors(corsOptions));

const routes = require("./routes/route");
app.use("/api/v1", routes);

app.get("/", (req, res)=>{
    res.send("<h1>Hello sagar</h1>");
})

app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
})
