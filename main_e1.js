const { exec } = require("child_process");
const express = require("express");
const app = express();
const multer = require("multer");
const uuid4 = require("uuid4");
const path = require("path");
const nodeName = process.env.NODE_NAME; // 환경 변수에서 nodeName을 가져옵니다.
app.use(express.static(path.join(__dirname, "public")));


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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
                pythonCommand = `python3 /coral/pycoral/examples/ci3.py \
                --model /coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite \
                --labels /coral/pycoral/test_data/inat_bird_labels.txt \
                --input ${file.path}`;
            } else {
                console.log("Error: Node name does not match any specific conditions.");
                reject("Node name error");
            }
            const start = process.hrtime();
            exec(pythonCommand, (error, stdout, stderr) => {
                const end = process.hrtime(start);
                if (error || stderr) {
                    console.error(`Execution error for file ${file.filename}: ${error || stderr}`);
                    
                    results.push({node: nodeName, output: stdout,sec : end[0],nano : end[1]});
                    resolve(); // Continue with other files
                } else {
                    console.log(`Output for file ${file.filename}: ${stdout}`);
                    //file.filename
                    //results.push({node: nodeName, output: stdout});
                    // const end = process.hrtime(start);
                    results.push({node : nodeName,second : end[0],nanosec : end[1]}) //시간 측정
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

// function delay(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }

// app.post("/yes-tpu", uploadMiddleware, async (req, res) => {
//     console.log("Enter API");
//     let results = [];
//     const start = process.hrtime();
//     for (const file of req.files) {
//         await delay(1000); // 각 파일 처리 전 1초 지연
//         const pythonCommand = buildPythonCommand(file); // 파이썬 명령어 구성
//         console.log(`Processing: ${file.filename}`);

//         try {
//             const { error, stdout, stderr } = await executePythonCommand(pythonCommand);
            
//             if (error || stderr) {
//                 console.error(`Execution error for file ${file.filename}: ${error || stderr}`);
//                 results.push({ node: nodeName, error: error.message || stderr });
//             } else {
//                 console.log(`Output for file ${file.filename}: ${stdout}`);
//                 results.push({node : nodeName})
//             }
//         } catch (err) {
//             console.error(`Unhandled error for file ${file.filename}: ${err}`);
//             results.push({ node: nodeName, error: err.message });
//         }
//     }
//     const end = process.hrtime(start);
//     results.push({total_sec : end[0],total_nano_sec : end[1]})
//     res.json(results); // 결과 반환
// });

// function buildPythonCommand(file) {
//     if (nodeName === 'nodeone') {
//         return `python3 /coral/pycoral/examples/ci4.py \
//                 --model /coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite \
//                 --labels /coral/pycoral/test_data/inat_bird_labels.txt \
//                 --input ${file.path}`;
//     } else if (nodeName === 'nodetwo' || nodeName === 'nodethree') {
//         return `python3 /coral/pycoral/examples/classify_image.py \
//                 --model /coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite \
//                 --labels /coral/pycoral/test_data/inat_bird_labels.txt \
//                 --input ${file.path}`;
//     } else {
//         throw new Error("Node name does not match any specific conditions.");
//     }
// }

// async function executePythonCommand(command) {
//     return new Promise((resolve, reject) => {
//         exec(command, (error, stdout, stderr) => {
//             if (error || stderr) {
//                 reject({ error, stderr });
//             } else {
//                 resolve({ stdout });
//             }
//         });
//     });
// }

  
app.listen(12345, () => {
  console.log("Server is running at port 12345");
});