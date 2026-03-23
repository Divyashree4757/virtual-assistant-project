import express from "express"
import { askToAssistant, getCurrentUser, updateAssistant, elevenlabsTts } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"      // ✅ Keep middlewares (plural)
import upload from "../middlewares/multer.js"     // ✅ Keep middlewares (plural)

const userRouter = express.Router()

userRouter.get("/current", isAuth, getCurrentUser)
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssistant)
userRouter.post("/asktoassistant", isAuth, askToAssistant)
userRouter.post("/tts", isAuth, elevenlabsTts)

export default userRouter
