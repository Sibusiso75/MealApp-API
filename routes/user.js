const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const User= require("../models/User.js")
const router = express.Router()

router.post("/register", async (req, res)=>{
    const {username, email, password} = req.body;
    const user = await User.findOne({email})
    if(user){
      return res.json({message:"User already exists"})
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = new User({
      username,
      email,
      password:hashedPassword,
    })
    await newUser.save()
  return res.json({status:true,message:"user registered"})
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
  
   const token = jwt.sign({
    username:user.username,
   }, process.env.KEY, {expiresIn:"1h"})
   res.cookie('token', token, {httpOnly:true, maxAge:360000})
    return res.json({status:true, message:"User logged in successfully"})
})

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
      <a href="http://localhost:5173/resetPassword/${encodedToken}">
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


const verifyUser = async(req, res, next)=>{
try {
  const token = req.cookies.token;
  if(!token){
    return res.json({status:false, message:"no token valid"})
  }
  const decoded = jwt.verify(token, process.env.KEY)
  const username= decoded.username;
  return res.json({status:true, username:username})
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
// const router = require("express").Router()
// const { verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./verifyToken")
// const User = require("../models/User")
// const bcrypt = require("bcryptjs")
// // const path = require("path")
// // const multer = require("multer")

// // const storage = multer.diskStorage({
// //   destination:(req, file, cb)=>{
// //   cb(null, "public/Images")
// //   },
// //   filename:(req, file, cb)=>{
// //       cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
// //       }

// // })

// // const upload = multer({
// //   storage:storage
// // })
// // router.post("/upload", upload.single("file"),(req, res)=>{
 
// // })


// //UPDATE - add verifyTokenAndAuthorization
// router.put("/:id",  async (req, res)=>{    
//      try {
//           const hashedPassword = await bcrypt.hash(req.body.password, 10)
//         const updatedUser = await User.findByIdAndUpdate(req.params.id,{
//             $set:req.body, password:hashedPassword
//         },{new:true})
//         res.status(200).json(updatedUser)
//      } catch (error) {
//         res.status(500).json(error)
//      }
// })
// //DELETE - add verifyTokenAndAuthorization


// router.delete("/:id", async(req, res)=>{
//   try {
//     await User.findByIdAndDelete(req.params.id)
//   } catch (error) {
//     res.status(500).json(error)
//   }
// })
// // GET - add verifyTokenAndAdmin
// router.get("/", async(req, res)=>{
//     try {
//      const users = await User.find();
//      res.status(200).json(users)
//     } catch (error) {
//       res.status(500).json(error)
//     }
//   })

// module.exports = router