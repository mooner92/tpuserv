const { exec } = require("child_process");
const express = require("express");
const app = express();
const multer = require("multer");
const uuid4 = require("uuid4");
const path = require("path");
const nodeName = process.env.NODE_NAME; // 환경 변수에서 nodeName을 가져옵니다.
app.use(express.static(path.join(__dirname, "public")));
//const cors = require('cors');

// CORS 미들웨어 설정 전에 로깅 미들웨어를 추가
// app.use((req, res, next) => {
//     console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
//     console.log('Path:', req.path);
//     console.log('Received Request:', req.method, req.url);
//     console.log('Origin:', req.headers.origin);
//     console.log('CORS Headers:', JSON.stringify(req.headers['access-control-request-headers']));
//     console.log('Sending CORS Headers:', res.getHeader('Access-Control-Allow-Origin'));
//     res.header("Access-Control-Allow-Origin", "*"); // 모든 도메인에서의 요청 허용
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//     if (req.method === 'OPTIONS') {
//         res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
//         return res.status(200).json({});
//     }
//     next();
// });

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*"); // 모든 도메인에서의 요청 허용
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//     res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    
// });



  
  
// const corsOptions = {
//     origin: '*', // 모든 도메인에서의 요청 허용
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메소드
//     allowedHeaders: ['Content-Type', 'Authorization'], // 허용할 헤더
//     credentials: true, // 쿠키 허용
//     preflightContinue: false, // OPTIONS 요청에 대해 별도의 응답을 보내지 않음
//     optionsSuccessStatus: 204 // OPTIONS 요청 성공 상태 코드
// };

//app.use(cors(corsOptions));

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
                    results.push({node: nodeName, output: stdout});
                    resolve(); // Continue with other files
                } else {
                    console.log(`Output for file ${file.filename}: ${stdout}`);
                    //file.filename
                    const start = process.hrtime();
                    results.push({node: nodeName, output: stdout});
                    const end = process.hrtime(start);
                    results.push({second : end[0],nanosec : end[1]}) //시간 측정
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