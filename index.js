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
    origin:["http://localhost:5173"],
    credentials:true
}))
app.use(cookieParser())
mongoose.connect(process.env.MONGO_DB).then(()=>{
    console.log("Movie Database connected successfully")
}).catch((err)=>{
    console.log(err)
})
app.use("/", UserRouter)




app.listen(process.env.PORT, ()=>{
    console.log(`Listening to port ${process.env.PORT} `)
})
