import jwt from "jsonwebtoken"

const genToken = (userId) => {  // store id key to match isAuth
    try {
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "10d" })
        return token
    } catch (error) {
        console.error('Token generation failed:', error)
        throw error
    }
}

export default genToken
