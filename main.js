const { exec } = require("child_process");
const express = require("express");
const app = express();
const path = require("path");
const publicPath = path.join(__dirname, "public");
const multer = require("multer");
const uuid4 = require("uuid4");
const fs = require("fs");
const os = require("os");

app.use(express.static(publicPath));

const upload = multer({
  storage: multer.diskStorage({
    filename(req, file, done) {
      const randomID = uuid4();
      const ext = path.extname(file.originalname);
      const filename = randomID + ext;
      done(null, filename);
    },
    destination(req, file, done) {
      done(null, path.join(__dirname, "files"));
    },
  }),
});

const uploadMiddleware = upload.array("myFiles");

app.post("/upload", uploadMiddleware, (req, res) => {
  const uploadedFilePath = req.files[0].path;
  const homeDir = os.homedir();
  const pycoralPath = path.join(homeDir, "coral");
  const nd1Path = path.join(homeDir, "nd1");

  fs.access(pycoralPath, fs.constants.F_OK, (err) => {
    if (!err) {
      // ~/pycoral 디렉토리가 존재하는 경우
      console.log('coral exist!');
      const pythonCommand = `python3 ~/coral/pycoral/examples/classify_image.py \
        --model ~/coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant_edgetpu.tflite \
        --labels ~/coral/pycoral/test_data/inat_bird_labels.txt \
        --input ${uploadedFilePath}`;
      executePythonCommand(pythonCommand);
    } else {
      // ~/pycoral 디렉토리가 없는 경우, ~/nd1 디렉토리를 확인
      fs.access(nd1Path, fs.constants.F_OK, (err) => {
        if (!err) {
            console.log('coral is unexist but nd1 is exist!');
          // ~/nd1 디렉토리가 존재하는 경우
          const pythonCommand = `python3 ~/nd1/coral/pycoral/examples/ci4.py \
            --model ~/nd1/coral/pycoral/test_data/mobilenet_v2_1.0_224_inat_bird_quant.tflite \
            --labels ~/nd1/coral/pycoral/test_data/inat_bird_labels.txt \
            --input ${uploadedFilePath}`;
          executePythonCommand(pythonCommand);
        } else {
            console.log('both unexist!')
          // 둘 다 존재하지 않는 경우
          return res.status(500).send("Error: Neither pycoral nor nd1 directories exist.");
        }
      });
    }
  });

  function executePythonCommand(pythonCommand) {
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
      res.status(200).send(stdout);
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running at 3000");
});
