const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const User= require("../models/User.js")
const router = express.Router()
const Token = require("../models/Token.js")
// const crypto = require("crypto")

router.get("/", (req, res)=>{
  res.send("Hello world from the server")
})

router.post("/register", async (req, res)=>{
    const {username, email, password} = req.body;
    let user = await User.findOne({email})
    if(user){
      return res.json({message:"User already exists"})
    }
    const hashedPassword = await bcrypt.hash(password, 10)

    user = new User({
      username,
      email,
      password:hashedPassword,
    })
    await user.save()
    const token = new Token({
      userId:user._id,
      token:crypto.randomBytes(32).toString("hex")
    })
    await token.save()
    var transporter = nodemailer.createTransport({
      service:"gmail",
      auth:{
        user:process.env.MYEMAIL, pass:process.env.MEALPASS}
    })
    var mailOptions = {
      from:process.env.MYEMAIL,
      to:email,
      subject:"Verify Email",
      html:`<p>Hi, ${user.username}</p>
      <p>Verify your account by clicking the link below</p>       
      <a href="https://s-mealrecipes.netlify.app/users/${user_id}/verify/${token.token}">
      Verify link</a>
      `
    }
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        console.log(error)
      }
      else{
       return res.json({message:"Email sent"})
      }
    })

  return res.json({status:true,message:"Verification link is sent to your email verify your account. Please check it."})
})
router.get("/:id/verify/:token", async (req, res)=>{
  try {
    const user = await User.findOne({_id:req.params.id})
    if(!user){
      return res.status(400).send({message:"Invalid link"})
    }
    const token = await Token.findOne({
      userId:user_id,
      token:req.params.token,
    })
    if(!token){
      return res.status(400).send({message:"Invalid link"})
    }
    await User.updateOne({_id:user._id, verified:true})
    await token.remove()
    res.status(200).send({message:"Email verified successfully"})
  } catch (error) {
    res.status(500).send({message:"Internal server error"})

  }
})


router.post("/login", async(req, res)=>{
   const {email, password} = req.body;
   const user = await User.findOne({email})
   if(!user){
  return res.json({message:"User does not exist"})
}
   const passwordValid = await bcrypt.compare(password, user.password)

   if(!passwordValid){
    return res.json({message:"Password is incorrect"})
   }
   if(!user.verified){
    let token = await Token.findOne({userId:user_id})
    if(!token){
      var transporter = nodemailer.createTransport({
        service:"gmail",
        auth:{
          user:process.env.MYEMAIL, pass:process.env.MEALPASS}
      })
      var mailOptions = {
        from:process.env.MYEMAIL,
        to:email,
        subject:"Verify Email",
        html:`<p>Hi, ${user.username}</p>
        <p>Verify your account by clicking the link below</p>       
        <a href="https://s-mealrecipes.netlify.app/users/${user_id}/verify/${token.token}">
        Verify link</a>
        `
      }
      transporter.sendMail(mailOptions, function(error, info){
        if(error){
          console.log(error)
        }
        else{
         return res.json({message:"Email sent"})
        }
      })
    }
    return res.json({status:true})
   }
   const token = jwt.sign({
    username:user.username }, process.env.KEY, {expiresIn:"1h"})

   res.cookie('token', token, 
   {httpOnly:true,sameSite:"none",secure:true, maxAge:360000})
    return res.json({status:true, message:"User logged in successfully"})})


router.post("/forgot-password", async (req, res)=>{
  const {email} = req.body;  
  try {
    const user =  await User.findOne({email})
    if(!user){
      return res.json({message:"user is not registered"}) 
    }
    const token = jwt.sign({id:user._id}, process.env.KEY, {expiresIn:"5m"})
    var transporter = nodemailer.createTransport({
      service:"gmail",
      auth:{
        user:process.env.MYEMAIL, pass:process.env.MEALPASS}
    })
    const encodedToken = encodeURIComponent(token).replace(/\./g, "%2E")
    
    var mailOptions = {
      from:process.env.MYEMAIL,
      to:email,
      subject:"Reset password",
      html:`<p>Hi ${user.username}</p>
      <p>To reset your password, click the link below.</p>       
      <a href="https://s-mealrecipes.netlify.app/resetPassword/${encodedToken}">
      Reset password link</a>
      `
    }
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
        console.log(error)
      }
      else{
       return res.json({status:true, message:"Email sent"})
      }
    })
  } catch (error) {
    console.log(error)
  }
})

router.post("/reset-password/:token", async (req, res)=>{
  const {token} = req.params;
  const {password} = req.body;
  try {
    const decoded = jwt.verify(token, process.env.KEY)
    const id = decoded.id;
    const hashedPassword = await bcrypt.hash(password, 10)
    await User.findByIdAndUpdate({_id:id},{password:hashedPassword})
     return res.json({status:true, message:"password updated successfully"})
} catch (error) {
     return res.json("Invalid token")}
})

async function verifyUser(req, res) {
  try {
    const token = req.cookies.token
    if (!token) {
      return res.json({ status: false, message: "no token valid" })
    }
    const decoded = jwt.verify(token, process.env.KEY)
    const username = decoded.username
    return res.json({ status: true, username: username })
  } catch (error) {
    return res.json(error)
  }
}

router.get("/verify",verifyUser, async (req, res)=>{
  return res.json({message:"Authorised"})
})

router.get("/logout", async (req, res)=>{
   res.clearCookie("token")
   res.json({status:true})
})

module.exports = router 


