const { exec } = require("child_process");
const express = require("express");
const multer = require("multer");
const uuid4 = require("uuid4");
const path = require("path");
const fs = require("fs"); // 파일 시스템 모듈 추가

const app = express();
const nodeName = process.env.NODE_NAME;
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
    filename(req, file, done) {
        const randomID = uuid4();
        const ext = path.extname(file.originalname);
        done(null, `${randomID}${ext}`);
    },
    destination: path.join(__dirname, "files")
});
const upload = multer({ storage: storage });
const uploadMiddleware = upload.array("myFiles");

app.post("/yes-tpu", uploadMiddleware, async (req, res) => {
    if (!req.files.length) {
        return res.status(400).send("No files uploaded.");
    }

    let pythonCommand = buildPythonCommand(nodeName);
    try {
        const start = process.hrtime();
        const output = await executePythonCommand(pythonCommand);
        const end = process.hrtime(start);
        const results = {
            node: nodeName,
            output: output,
            executionTime: `${end[0]}s ${end[1] / 1000000}ms`
        };
        res.json(results);
    } catch (err) {
        res.status(500).json({
            node: nodeName,
            error: err.message
        });
    } finally {
        // 파일 삭제 로직
        cleanUpFiles(path.join(__dirname, "files"));
    }
});

function buildPythonCommand(nodeName) {
    if(nodeName === 'nodeone'){
        return `python3 /coral/pycoral/examples/ci6.py \
            --model /coral/pycoral/test_data/inception_v4_299_quant.tflite \
            --directory ./files \
            --labels /coral/pycoral/test_data/inat_bird_labels.txt`;
    }
    else if(nodeName === 'nodetwo' || nodeName ==='nodethree'){
        return `python3 /coral/pycoral/examples/ci5.py \
            --model /coral/pycoral/test_data/inception_v4_299_quant_edgetpu.tflite \
            --directory ./files \
            --labels /coral/pycoral/test_data/inat_bird_labels.txt`;
    }
    else{
        res.status(404).json({
            message : "nodeName doesn't exist"
        })
    }
    
}

function executePythonCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                reject(new Error(`Execution error: ${stderr || error}`));
            } else {
                resolve({ stdout });
            }
        });
    });
}

function cleanUpFiles(directory) {
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            fs.unlink(path.join(directory, file), err => {
                if (err) throw err;
            });
        }
    });
}

app.listen(12345, () => {
    console.log("Server is running at port 12345");
});
