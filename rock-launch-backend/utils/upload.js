const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const uploadDir = isVercel ? '/tmp/' : 'uploads/';

if (!isVercel && !fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage for legacy/local photos (Won't persist on Vercel)
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const absoluteUploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(absoluteUploadDir)) {
            fs.mkdirSync(absoluteUploadDir, { recursive: true });
        }
        cb(null, absoluteUploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename: remove spaces and special chars, keep dots and extension
        const sanitized = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '');
        cb(null, Date.now() + '-' + sanitized);
    }
});

// Memory storage for ephemeral file processing (e.g. Excel import)
const memoryStorage = multer.memoryStorage();

const upload = multer({ storage: diskStorage });
const memoryUpload = multer({ storage: memoryStorage });

module.exports = {
    upload,
    memoryUpload
};
