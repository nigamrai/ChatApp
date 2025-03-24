const multer = require('multer');

const upload = multer({
    dest: 'uploads/', 
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB size limit
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/'); // Specify the destination directory
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname); // Set the filename as the original file name
        }
    })
});

module.exports = upload;