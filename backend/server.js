const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});
mongoose.connect(process.env.MONGO_URI)
    .then(function(){
        console.log("MongoDB connected");
    })
    .catch(function(error){
        console.log(error);
    })
//======================MONGO DB====================//    
const noteSchema = new mongoose.Schema({
    text: {
        type: String,
        required : true
    },
    userId : {
        type:mongoose.Schema.Types.ObjectId,
        required: true
    }
},{timestamps : true});

const Note = mongoose.model("Note", noteSchema);
const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    }
});
const User = mongoose.model("User",userSchema);
//==================================================//
const app = express();
app.use(express.json());
//mongodb+srv://sricharanpusarla_db_user:ActqBAMb0c1nLiyD@cluster0.vqflaap.mongodb.net/?appName=Cluster0
// app.use() takes a function
// This lets our frontend communicate with our backend
app.use(function(req, res, next) {

    // Allow requests from our frontend
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Allow the Content-Type header
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Allow GET, POST, and OPTIONS requests
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE,PUT");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204); // stop here, don't call next()
    }
    // next() tells Express to continue to the next thing
    next();
});

app.put("/notes/:id",function(req,res){
    
    Note.findByIdAndUpdate(req.params.id,{
        text : req.body.text
    },{
        new : true
    }).then(function(success){
        res.status(200).json(success);
    }).catch(function(error){
        console.log(error)
        res.status(500).json({
            message : "Something went wrong in editing"
        });
        
    });
});
app.post("/register",async function(req,res){
    const hash = await bcrypt.hash(req.body.password,10);
    User.create({
        username : req.body.username,
        password : hash
    }).then(function(done){
        res.status(200).json(done);
    }).catch(function(error){
        console.error("Registration failed:", error);
        res.status(error.name === "ValidationError" ? 400 : 500).json({
            message : error.name === "ValidationError"
                ? "Username and password are required"
                : "Something went wrong in register"
        });
    });
});

app.post("/login",async function(req,res){
    const user = await User.findOne({
        username : req.body.username
    });
    if(!user){
        return res.status(401).json({
            message : "Invalid username or password"
        });
    }
    const passwordmatch = await bcrypt.compare(
        req.body.password,
        user.password
    );
    if (!passwordmatch) {
    return res.status(401).json({
        message: "Invalid username or password"
    });
}
    const token = jwt.sign(
        {
            userId : user._id
        },
        process.env.JWT_SECRET
    );
    res.status(200).json({
        id: user._id,
        username : user.username,
        token : token
    });
    console.log(passwordmatch);
    console.log(user)
})
app.get("/",function(req,res){
    res.json({
        message: "Welcome to mini notes."
    })
});
app.get("/notes",function(req,res){
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    Note.find({
        userId : decoded.userId
    }).then(function(foundNotes){
        res.status(200).json(foundNotes);
    }).catch(function(error){
        console.log(error);
        res.status(500).json({
            message : "Something went wrong in finding"
        });
    });
});
app.post("/notes",function(req,res){
    Note.create(req.body).then(function(savedNote){
        res.status(201).json(savedNote);
    }).catch(function(error){
        res.status(400).json({
            message : "Something went wrong chigga"
        });
    });
    
});
app.delete("/notes/:id",function(req,res){
    Note.findByIdAndDelete(req.params.id).then(function(deletedNode){
        res.status(200).json(deletedNode);
    }).catch(function(error){
        console.log(error);
        res.status(500).json({
            message : "Something went wrong in deleting"
        });
    });
});




// listen() takes the port number and a function
// It starts the backend on that port and runs the function when the server is ready
app.listen(5000, function() {

    console.log("Server running on port 5000");
});