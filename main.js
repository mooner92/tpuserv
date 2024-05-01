const { exec } = require("child_process");
const express = require("express");
const app = express();
const multer = require("multer");
const uuid4 = require("uuid4");
const path = require("path");
const nodeName = process.env.NODE_NAME; // 환경 변수에서 nodeName을 가져옵니다.
app.use(express.static(path.join(__dirname, "public")));
const cors = require('cors');

// CORS 미들웨어 설정 전에 로깅 미들웨어를 추가
app.use((req, res, next) => {
    console.log('Received Request:', req.method, req.url);
    console.log('Origin:', req.headers.origin);
    console.log('CORS Headers:', JSON.stringify(req.headers['access-control-request-headers']));
    next();
  });
  
app.use(cors()); // 모든 도메인의 요청을 허용
const upload = multer({
  storage: multer.diskStorage({
    filename(req, file, done) {
      const randomID = uuid4();
      const ext = path.extname(file.originalname);
      done(null, `${randomID}${ext}`);
    },
    destination: path.join(__dirname, "files")
  }),
});

const uploadMiddleware = upload.array("myFiles");


app.post("/yes-tpu", uploadMiddleware, (req, res) => {
    console.log("enter api no start")
    let results = [];
    let promises = req.files.map(file => {
        return new Promise((resolve, reject) => {
            let pythonCommand;
            console.log('enter promise')
            if (nodeName === 'nodeone') {
                console.log(`Processing on nodeone: ${file.filename}`);
                pythonCommand = `python3 /coral/pycoral/examples/ci4.py \
                --model /coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite \
                --labels /coral/pycoral/test_data/inat_bird_labels.txt \
                --input ${file.path}`;
            } else if (nodeName === 'nodetwo' || nodeName === 'nodethree') {
                console.log(`Processing on nodetwo or nodethree: ${file.filename}`);
                pythonCommand = `python3 /coral/pycoral/examples/classify_image.py \
                --model /coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite \
                --labels /coral/pycoral/test_data/inat_bird_labels.txt \
                --input ${file.path}`;
            } else {
                console.log("Error: Node name does not match any specific conditions.");
                reject("Node name error");
            }

            exec(pythonCommand, (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Execution error for file ${file.filename}: ${error || stderr}`);
                    results.push({file: file.filename, error: error.message || stderr});
                    resolve(); // Continue with other files
                } else {
                    console.log(`Output for file ${file.filename}: ${stdout}`);
                    results.push({file: file.filename, output: stdout});
                    resolve();
                }
            });
        });
    });
    console.log('upto return')
    Promise.all(promises).then(() => {
        res.json(results); // Send combined results back to client
    }).catch(err => {
        res.status(500).send(`Error processing files: ${err}`);
    });
});

  
app.listen(12345, () => {
  console.log("Server is running at port 12345");
});