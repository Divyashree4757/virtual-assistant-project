import express from "express"
import { Login, logOut, signUp } from "../controllers/auth.controllers.js"
import isAuth from "../middlewares/isAuth.js"

const authRouter = express.Router()

authRouter.post("/signup", signUp)
authRouter.post("/signin", Login)
authRouter.get("/logout", logOut)

export default authRouter
