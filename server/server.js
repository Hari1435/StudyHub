const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv= require("dotenv");
const authRoutes=require('./routes/auth.js');
const facultyRoutes=require('./routes/Facutlyroutes.js');
dotenv.config();
mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("Connected to MongoDB");
}).catch((err)=>{
    console.log("Error connecting to MongoDB",err);
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth',authRoutes);
app.use('/api/faculty',facultyRoutes);
app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
});

