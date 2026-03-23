import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

const uploadOnCloudinary = async (filePath) => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });

    try {
        const uploadResult = await cloudinary.uploader.upload(filePath)
        // ✅ FIXED: Delete AFTER successful upload
        fs.unlinkSync(filePath)
        // ✅ FIXED: Return result
        return uploadResult.secure_url
    } catch (error) {
        // ✅ FIXED: No res - just throw/log error
        console.error('Cloudinary upload failed:', error)
        // ✅ FIXED: Safe cleanup (check exists first)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
        // ✅ FIXED: Throw error for caller to handle
        throw new Error(`Cloudinary upload failed: ${error.message}`)
    }
}

export default uploadOnCloudinary
