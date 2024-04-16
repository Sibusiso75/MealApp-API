

const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
	{
		username: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		verified:{type:Boolean, default:false},
        isAdmin: {type:Boolean, default:false}
	
	},
	{ timestamps: true}
)

const model = mongoose.model('User', UserSchema)

module.exports = model

// const userSchema = new mongoose.Schema({
// 	username:{type:String, required:true, unique:true},
// 	email:{type:String, required:true, unique:true},
// 	password:{type:String, required:true},
// })
// const model = mongoose.model("User", userSchema)
// module.exports = model