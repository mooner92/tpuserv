const { exec } = require("child_process");
const express = require("express");
const app = express();
const multer = require("multer");
const uuid4 = require("uuid4");
const path = require("path");

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

app.post("/upload", uploadMiddleware, (req, res) => {
  req.files.forEach(file => {
    let pythonCommand;

    if (nodeName === 'nodeone') {
      // nodeone의 경우 실행할 Python 커맨드
      pythonCommand = `python3 ~/nd1/coral/pycoral/examples/ci4.py \
        --model ~/nd1/coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite \
        --labels ~/nd1/coral/pycoral/test_data/inat_bird_labels.txt \
        --input ${file.path}`;
    } else if (nodeName === 'nodetwo' || nodeName === 'nodethree') {
      // nodetwo 또는 nodethree의 경우 실행할 Python 커맨드
      pythonCommand = `python3 ~/coral/pycoral/examples/classify_image.py \
        --model ~/coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant_edgetpu.tflite \
        --labels ~/coral/pycoral/test_data/inat_bird_labels.txt \
        --input ${file.path}`;
    } else {
      // 알려지지 않은 노드 이름인 경우
      return res.status(500).send("Error: Node name does not match any specific conditions.");
    }

    // Python 커맨드 실행
    executePythonCommand(pythonCommand, res);
  });
});

function executePythonCommand(pythonCommand, res) {
  exec(pythonCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Error: ${error.message}`);
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return res.status(500).send(`Error: ${stderr}`);
    }
    console.log(`stdout: ${stdout}`);
    res.send(stdout); // 각 파일 처리 결과를 바로 반환
  });
}

app.listen(12345, () => {
  console.log("Server is running at 12345");
});
