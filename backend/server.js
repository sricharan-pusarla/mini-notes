const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});


// ====================== MONGO DB ======================

mongoose.connect(process.env.MONGO_URI)
    .then(function() {
        console.log("MongoDB connected");
    })
    .catch(function(error) {
        console.log(error);
    });


const noteSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }

}, {
    timestamps: true
});


const Note = mongoose.model("Note", noteSchema);


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    }
});


const User = mongoose.model("User", userSchema);


// ======================================================


const app = express();

app.use(express.json());


// ====================== CORS ======================

app.use(function(req, res, next) {

    // Allow requests from our frontend
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Allow the frontend to send these headers
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    // Allow these HTTP methods
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, DELETE, PUT"
    );

    // Browser sends OPTIONS before some requests
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    // Continue to the actual route
    next();
});


// ====================== JWT MIDDLEWARE ======================

// Takes req, res, and next.
// Checks the JWT sent by the frontend.
// If the token is valid, puts the user's ID into req.userId.
function authenticate(req, res, next) {

    if (!req.headers.authorization) {
        return res.status(401).json({
            message: "You must be logged in"
        });
    }

    const token = req.headers.authorization.split(" ")[1];

    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    }
    catch (error) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }

    req.userId = decoded.userId;

    next();
}


// ====================== REGISTER ======================

// Takes req and res.
// Creates a new user after hashing their password.
app.post("/register", async function(req, res) {

    try {

        const hash = await bcrypt.hash(
            req.body.password,
            10
        );

        const user = await User.create({
            username: req.body.username,
            password: hash
        });

        res.status(200).json(user);

    }
    catch (error) {

        console.error("Registration failed:", error);

        res.status(
            error.name === "ValidationError" ? 400 : 500
        ).json({
            message:
                error.name === "ValidationError"
                    ? "Username and password are required"
                    : "Something went wrong in register"
        });
    }
});


// ====================== LOGIN ======================

// Takes req and res.
// Checks the username and password and gives the user a JWT if they are correct.
app.post("/login", async function(req, res) {

    try {

        const user = await User.findOne({
            username: req.body.username
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET
        );

        res.status(200).json({
            id: user._id,
            username: user.username,
            token: token
        });

    }
    catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Something went wrong in login"
        });
    }
});


// ====================== HOME ======================

// Takes req and res.
// Shows a simple message when someone visits the backend.
app.get("/", function(req, res) {

    res.json({
        message: "Welcome to mini notes."
    });
});


// ====================== GET NOTES ======================

// Takes req and res.
// Gets only the notes belonging to the logged-in user.
app.get("/notes", authenticate, function(req, res) {

    Note.find({
        userId: req.userId
    })
        .then(function(foundNotes) {

            res.status(200).json(foundNotes);

        })
        .catch(function(error) {

            console.log(error);

            res.status(500).json({
                message: "Something went wrong in finding"
            });
        });
});


// ====================== CREATE NOTE ======================

// Takes req and res.
// Creates a note and automatically gives it to the logged-in user.
app.post("/notes", authenticate, function(req, res) {

    Note.create({
        text: req.body.text,
        userId: req.userId
    })
        .then(function(savedNote) {

            res.status(201).json(savedNote);

        })
        .catch(function(error) {

            console.log(error);

            res.status(400).json({
                message: "Something went wrong in creating"
            });
        });
});


// ====================== UPDATE NOTE ======================

// Takes req and res.
// Updates a note only if that note belongs to the logged-in user.
app.put("/notes/:id", authenticate, function(req, res) {

    Note.findOneAndUpdate(
        {
            _id: req.params.id,
            userId: req.userId
        },
        {
            text: req.body.text
        },
        {
            new: true
        }
    )
        .then(function(updatedNote) {

            if (!updatedNote) {
                return res.status(404).json({
                    message: "Note not found"
                });
            }

            res.status(200).json(updatedNote);

        })
        .catch(function(error) {

            console.log(error);

            res.status(500).json({
                message: "Something went wrong in editing"
            });
        });
});


// ====================== DELETE NOTE ======================

// Takes req and res.
// Deletes a note only if that note belongs to the logged-in user.
app.delete("/notes/:id", authenticate, function(req, res) {

    Note.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
    })
        .then(function(deletedNote) {

            if (!deletedNote) {
                return res.status(404).json({
                    message: "Note not found"
                });
            }

            res.status(200).json(deletedNote);

        })
        .catch(function(error) {

            console.log(error);

            res.status(500).json({
                message: "Something went wrong in deleting"
            });
        });
});


// ====================== START SERVER ======================

app.listen(5000, function() {

    console.log("Server running on port 5000");
});