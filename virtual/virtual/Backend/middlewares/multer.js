import multer from "multer"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads/temp"))  // ✅ FIXED: Safe path
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))  // ✅ FIXED: Unique name
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('Only images allowed'), false)
    }
}

const upload = multer({ 
    storage,
    fileFilter,  // ✅ FIXED: Image validation
    limits: { fileSize: 5 * 1024 * 1024 }  // 5MB limit
})

export default upload
