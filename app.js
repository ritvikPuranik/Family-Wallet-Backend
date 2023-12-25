const express = require('express');
const multer = require('multer');
const Jimp = require("jimp");
const qrCode = require('qrcode-reader');

const app = express();
const port = 3000;

// const upload = multer({ dest: 'uploads/' })

// Set up multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

async function decodeQRCode(buffer) {
    return new Promise((resolve, reject) => {
      Jimp.read(buffer, async (err, image) => {
        if (err) {
          console.error(err);
          reject(err);
        }
  
        const qrcode = new qrCode();
        qrcode.callback = (err, value) => {
          if (err) {
            console.error(err);
            reject(err);
          }
  
          const code = value.result;
          console.log("code>", code);
          resolve(code);
        };
  
        qrcode.decode(image.bitmap);
      });
    });
}

// Handle POST requests to the '/upload' endpoint
app.post('/upload', upload.single('documentFile'), async(req, res) => {
    try{
    // const buffer = fs.readFileSync(__dirname + '/uploads/QR1.png');
    const buffer = req.file.buffer;
    
    let code = await decodeQRCode(buffer);
    code = JSON.parse(code);
    console.log("code json>", code);

    res.send(code);

    }catch(err){
        console.log("error while handling file>>", err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

