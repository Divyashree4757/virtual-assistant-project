import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    assistantName: {
        type: String,
        default: "Assistant"
    },
    assistantImage: {
        type: String,
        default: ""
    },
    gender: {
        type: String,
        enum: ["male", "female", "neutral"],
        default: "neutral"
    },
    history: [
        {
            type: String  // ✅ FIXED: Proper syntax
        }
    ]
}, { timestamps: true })

// ✅ FIXED: Critical indexes for performance
userSchema.index({ createdAt: -1 })

const User = mongoose.model("User", userSchema)
export default User
