const express = require("express")
const route = express.Router()
const User = require('../Models/Userschema')
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const Multer = require('multer')
const AsyncError = require('../Error/AsyncError');
const ErrorHandler = require("../Error/ErrorHandling");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const sendEmail = require("../Utilitis/Mail");
const fetchUser = require("../Utilitis/User");
require('dotenv/config')
const JWT_SECRET = process.env.JWT_SIGN;

cloudinary.config({
    cloud_name: process.env.Cloud_Name,
    api_key: process.env.Cloud_API_KEY,
    api_secret: process.env.Cloud_API_SECRET
});

var upload = Multer({ dest: "/tmp" });

// Create User Account
route.post("/sign-up", upload.single("file"), AsyncError(async (req, res, next) => {
    const { name, email, password } = req.body
    let user = await User.findOne({ email: req.body.email })
    if (user) {
        return next(new ErrorHandler("Email Already Registered, Try Login!", 400))
    }
    if (password.length < 8) {
        return next(new ErrorHandler("Password must have 8 character long!", 400))
    }
    const salt = await bcrypt.genSalt(10)
    const securePass = await bcrypt.hash(password, salt);
    
    const result = await cloudinary.uploader.upload(req.file.path);
    let profile = {
        name: name,
        email: email,
        password: securePass,
        avatar: {
            public_id: result.public_id,
            url: result.secure_url
        }
    }
    const userProfile = new User(profile)
    await userProfile.save()
    const data = {
        user: {
            id: userProfile._id,
            email: userProfile.email
        }
    }
    const authToken = jwt.sign(data, JWT_SECRET);
    res.cookie(`AuthToken`, `${authToken}`, {
        maxAge: Math.floor((Date.now() / 1000) + (60 * 86400) * 1000),
        secure: true,
        httpOnly: true,
        sameSite: "none",
        path: "/",
    });
    res.status(200).json({ 
        success: true,
        message: "Account created successfully"
    })
}))
// Login User account
route.post('/login', AsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    let user = await User.findOne({ email })
    if (!user) {
        return next(new ErrorHandler("Email is not registered, Please try sign up!", 400))
    }
    const passCompare = await bcrypt.compare(password, user.password)
    if (!passCompare) {
        return next(new ErrorHandler("Invalid Credentials", 400))
    }
    const data = {
        user: {
            id: user._id,
            email: user.email
        }
    }
    const authToken = jwt.sign(data, JWT_SECRET);
    res.cookie(`AuthToken`, `${authToken}`, {
        maxAge: Math.floor((Date.now() / 1000) + (60 * 86400) * 1000),
        secure: true,
        httpOnly: true,
        sameSite: "none",
        path: "/",
    });
    res.status(200).json({ // TODO Will add token with backend itself don't wanna send token into frontend;
        success: true,
        message: "Welcome " + user.name
    })
}))
// Verify Email Request
route.post('/request-email-verification', AsyncError(async (req, res, next) => {
    const { email } = req.body;
    let user = await User.findOne({ email })
    if (!user) {
        return next(new ErrorHandler("Email is not registered", 400))
    }
    const token = crypto.randomBytes(32).toString("hex")
    const newUserData = { EmailVerificationToken: token }
    await User.findByIdAndUpdate(user.id, newUserData, {new: true});
    const url = `${process.env.Verify_Url}/${user.id}/${token}`
    let Text = `<h1>Hello ${user.name}</h1>
                <p>Please verify your email</p>
                <a href=${url} target="_blank">Click Here To Verify</a>`
    await sendEmail(user.email, "Email Verification", Text)

    res.status(200).json({
        success: true,
        message: "Email Sent"
    })
    
}))
// Verify Email
route.post('/verify-email', AsyncError(async (req, res, next) => {
    const { id, token } = req.body;
    let user = await User.findOne({ _id: id, EmailVerificationToken: token })
    if (!user) {
        return next(new ErrorHandler("Invalid Token", 400))
    }
    const newUserData = { emailVerification: true }
    const data = await User.findByIdAndUpdate(user.id, newUserData, {new: true});
    res.status(200).json({
        success: true,
        message: "Successfully Verified"
    })
    
}))
// Account verify with token
route.post('/verify-token',fetchUser, AsyncError(async (req, res, next) => {
    if (!req.user) {
      return next(new ErrorHandler("Invalid Token", 400))
    }
    const { id } = req.user;
    let UserData = await User.findById(id)
    if(!UserData) return next(new ErrorHandler("User not found", 404))
    res.status(200).json({success: true, user: UserData})
}))
// Reset Pass request
route.post('/reset-pass-request', AsyncError(async (req, res, next) => {
    const {email} = req.body
    // resetPasswordToken
    const user = await User.findOne({email})
    if(!user){
        return next(new ErrorHandler('User not found', 404))
    }
    const token = crypto.randomBytes(32).toString("hex")
    const newUserData = { resetPasswordToken: token }
    await User.findByIdAndUpdate(user._id, newUserData, {new: true})
    const url = `${process.env.Verify_Url}/${user._id}/${token}`
    const mailBody = `<h1>Hello ${user.name}</h1>
                      <p>As per your request here is your reset password url</p>
                      <a href=${url} target="_blank">Reset Pass</a>`
    await sendEmail(email, "Reset Password Request" , mailBody)
    res.status(200).json({success: true, message: "Email Sent"})
}))
route.post('/reset-pass', AsyncError(async (req, res, next)=>{
    const { password, confirmPassword, id, token } = req.body
    if(password !== confirmPassword){
        return next(new ErrorHandler("Password not matched", 400))
    }
    if(password.length < 8){
        return next(new ErrorHandler("Password must be greater than 8 character", 400))
    }
    const user = await User.findOne({_id: id, resetPasswordToken: token})
    if(!user){
        return next(new ErrorHandler("Token Invalid", 400))
    }
    const salt = await bcrypt.genSalt(10)
    const securePass = await bcrypt.hash(password, salt);
    await User.findByIdAndUpdate(id, securePass, {new: true})
    res.status(200).json({success: true, message: "Successfully Updated"})
}))
// Sign-out (will do while working with frontend)
route.post('/sign-out', AsyncError(async (req, res, next) =>{
    res.clearCookie('AuthToken');
    res.status(200).json({success: true, message: "Successfully Log Out"})
}))
// Add addresses
route.post('/add-user-address',fetchUser, AsyncError(async (req, res, next)=>{
    const {id} = req.user
    const user = await User.findById(id)
    if(!user){return next(new ErrorHandler("Bad request", 400))}
    if(user.Addresses.length > 6){
        return next(new ErrorHandler("You can add only 6 addressess", 400))
    }
    if(req.body.isDefault === true && user.Addresses.length > 0){
        user.Addresses.forEach(add =>{
            add.isDefault = false
        })
    }
    req.body.addressId = id + `${user.Addresses.length}`
    user.Addresses.push(req.body)
    const data = await user.save()
    res.status(200).json({
        success: true,
        data,
        message: "address added"
    })
}))
// Update address
route.post('/update-address',fetchUser, AsyncError(async (req, res, next)=>{
    const {id} = req.user
    const user = await User.findById(id)
    const {street, country, city, state, houseName, zip, isDefault} = req.body
    if(!user){return next(new ErrorHandler("Bad request", 400))}
    const isAddress = user.Addresses.find(
        (add) => add.addressId === req.body.addressId
    );
    if (isAddress) {
        user.Addresses.forEach((add) => {
            add.isDefault = false
            if (add.addressId === req.body.addressId)
            (add.state = state), (add.street = street), (add.city = city),(add.country = country), (add.houseName = houseName), (add.zip = zip), (add.isDefault = isDefault);
        });
    }else{
        return (next(new ErrorHandler("Address not found", 404)))
    }
    const data = await user.save()
    res.status(200).json({
        success: true,
        data,
        message: "address update"
    })
}))
// Get all address
route.post('/get-address',fetchUser, AsyncError(async (req, res, next)=>{
    const {id} = req.user
    const user = await User.findById(id)
    if(!user){return next(new ErrorHandler("Bad request", 400))}

    res.status(200).json({
        success: true,
        data: user.Addresses,
        message: "listed"
    })
}))
// Delete address
route.post('/delete-address',fetchUser, AsyncError(async (req, res, next)=>{
    const {id} = req.user
    const user = await User.findById(id)
    if(!user){return next(new ErrorHandler("Bad request", 400))}
    const isAddress = user.Addresses.find(
        (add) => add.addressId === req.body.id
    );
    if(!isAddress){return next(new ErrorHandler("Address not found", 404))}
    let Addresses = user.Addresses.filter(add => add.addressId !== req.body.id);
    if(req.body.isDefault === true && Addresses.length >= 1){
        Addresses[0].isDefault = true
    }
    await User.findByIdAndUpdate(id, {Addresses})
    res.status(200).json({
        success: true,
        message: "Address Deleted"
    })
}))
// Update profile photo
route.post('/update-profile-photo',fetchUser, upload.single("file"), AsyncError(async (req, res, next)=>{
    const user = await User.findById(req.user.id);// will comes with fetch user 
    if(!user) return next(new ErrorHandler('Bad Request', 400));
    const data = await cloudinary.uploader.destroy(user.avatar.public_id)
    const result = await cloudinary.uploader.upload(req.file.path); //TODO If result is not ok then will send mail info about image not deleted!
    const updateAvatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    user.avatar = updateAvatar;
    await user.save()
    res.status(200).send({success: true, data, message: "Avatar Updated Successfully!"})  
}))
//Update profile dtetails (name / email)
route.post('/update-profile',fetchUser, AsyncError(async (req, res, next)=>{
    if(req.body.email){
        if(req.body.email !== req.user.email){
            const check = await User.findOne({email: req.body.email})
            if(check) return next(new ErrorHandler('Email already Exist', 400))
            req.body.EmailVerificationToken = ''
            req.body.emailVerification = false
        }
    }
    await User.findByIdAndUpdate(req.user.id, req.body)
    const updateUser = await User.findById(req.user.id)
    res.status(200).send({success: true, updateUser, message: 'Profile Updated Successfully !'})  
}))
// Profile page setup like order histry updating profile address cart an all
module.exports = route
