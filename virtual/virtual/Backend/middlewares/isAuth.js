import jwt from "jsonwebtoken"

const isAuth = (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({ message: "token not found" })
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in process.env")
            return res.status(500).json({ message: "Internal server error: missing secret" })
        }
        const verifyToken = jwt.verify(token, process.env.JWT_SECRET)

        // Support different token payload shapes (id or userId)
        const userId = verifyToken?.id || verifyToken?.userId || verifyToken?._id
        
        if (!userId) {
            return res.status(401).json({ message: "Invalid token payload" })
        }
        
        req.user = { id: userId }

        next()

    } catch (error) {
        console.error("isAuth error:", error.message)
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid session - please sign in again" })
        }
        return res.status(401).json({ message: "Invalid token" })
    }
}

export default isAuth