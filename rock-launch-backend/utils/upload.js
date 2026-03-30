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
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
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
