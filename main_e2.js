const { exec } = require("child_process");
const express = require("express");
const multer = require("multer");
const uuid4 = require("uuid4");
const path = require("path");

const app = express();
const nodeName = process.env.NODE_NAME;
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

app.post("/yes-tpu", uploadMiddleware, async (req, res) => {
    let results = [];
    for (const file of req.files) {
        let pythonCommand = buildPythonCommand(nodeName, file);
        try {
            const start = process.hrtime();
            const output = await executePythonCommand(pythonCommand);
            const end = process.hrtime(start);
            //executionTime: `${end[0]}s ${end[1] / 1000000}ms`
            results.push({
                node: nodeName,
                output : output
            });
        } catch (err) {
            results.push({
                node: nodeName,
                error: err.message
            });
        }
    }
    res.json(results);
});

function buildPythonCommand(nodeName, file) {
    if (nodeName === 'nodeone') {
        return `python3 /coral/pycoral/examples/ci6.py \
                --model /coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite \
                --directory ./files\
                --labels /coral/pycoral/test_data/inat_bird_labels.txt`;
    } else if (nodeName === 'nodetwo' || nodeName === 'nodethree') {
        return `python3 /coral/pycoral/examples/ci5.py \
                --model /coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite \
                --directory ./files\
                --labels /coral/pycoral/test_data/inat_bird_labels.txt`;
    } else {
        throw new Error("Node name does not match any specific conditions.");
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

app.listen(12345, () => {
    console.log("Server is running at port 12345");
});
