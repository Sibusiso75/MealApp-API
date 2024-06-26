const express= require("express")
const dotenv =require("dotenv")
const mongoose =require("mongoose")
const cors =require("cors")
const cookieParser=require("cookie-parser")
dotenv.config()
const UserRouter = require("./routes/user")
const app = express()

app.use(express.json())
app.use(cors({
    origin:["https://s-mealrecipes.netlify.app"],
    credentials:true
}))
app.use(cookieParser())
mongoose.connect(process.env.MONGO_DB).then(()=>{
    console.log("Meal Database connected successfully")
}).catch((err)=>{
    console.log(err)
})
app.use("/", UserRouter)




app.listen(process.env.PORT, ()=>{
    console.log(`Listening to port ${process.env.PORT} `)
})
