const express = require("express");
const cors = require("cors");
const formidable = require("express-formidable");
const app = express();
const pdfParse = require("pdf-parse");
const multer = require("multer");
const fs = require("fs");
const WordExtractor = require("word-extractor");
const tesseract = require("tesseract.js");
require("dotenv").config();
const fetch = require("node-fetch");
const { exec } = require("child_process");
const wav = require('wav');
const bodyParser = require('body-parser');

app.use(cors());
app.use(express.json());
// app.use(formidable());

// const storage = multer.memoryStorage();
const upload = multer();

const translateText = (fromLang, toLang, inputText, res) => {
    exec(`python ./python/translation.py ${fromLang} ${toLang} "${inputText}"`, (error, stdout, stderr) => {
        if (error) {
            console.error('Error executing Python script:', error);
            return res.status(500).send('Internal Server Error');
        }
        console.log(stdout)
        res.status(200).send({
            translatedText: stdout
        });
    });
}


app.get("/", (req, res) => {
  res.status(201).json({ message: "Connected to Backend!" });
});

app.post("/translate", (req, res) => {
  const { fromLang, toLang, inputText } = req.body;

  translateText(fromLang, toLang, inputText, res);
});

app.post("/filetranslate", upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'source' },
  { name: 'target' }
]), async (req, res) => {
  try {
    const { source, target } = req.body;
    console.log("Source:", source);
    console.log("Target:", target);

    const file = req.files.file ? req.files.file[0] : null;
    const fromLang = source;
    const toLang = target;
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
    
    console.log(file);
    if (file.mimetype == "application/pdf") {
      let dataBuffer = file.buffer;
      pdfParse(dataBuffer).then((result) => {
        console.log(result.text);
        translateText(fromLang, toLang, result.text, res);
      });
    } else {
      const extractor = new WordExtractor();
      const extracted = extractor.extract(file.buffer);
      extracted.then((doc) => {
        console.log(doc.getBody());
        translateText(fromLang, toLang, doc.getBody(), res);
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/fileimg", upload.fields([
  { name: 'img', maxCount: 1 },
  { name: 'source' },
  { name: 'target' }
]), async (req, res) => {
  try {
    const { source, target } = req.body;
    console.log("Source:", source);
    console.log("Target:", target);

    const image = req.files.img ? req.files.img[0] : null;
    const fromLang = source;
    const toLang = target;

    if (!image) {
      return res.status(400).json({ error: "Image data not provided" });
    }

    console.log(image);

    tesseract
      .recognize(image.buffer, "eng")
      .then((text) => {
        console.log("Result:", text.data.text);
        translateText(fromLang, toLang, text.data.text, res);
      })
      .catch((error) => {
        console.log(error.message);
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/fileaudio", upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'source' },
  { name: 'target' }
]), async (req, res) => {
  try {
    const { source, target } = req.body;
    console.log("Source:", source);
    console.log("Target:", target);

    const audio = req.files.audio ? req.files.audio[0] : null;
    const fromLang = source;
    const toLang = target;
    if (!audio) {
      return res.status(400).json({ error: "audio data not provided" });
    }
    console.log(audio);

    const tempFilePath = `${__dirname}/temp_audio_${Date.now()}.wav`;

    const wavFileStream = fs.createWriteStream(tempFilePath);
    wavFileStream.write(audio.buffer);
    wavFileStream.end();

    wavFileStream.on('finish', () => {
      console.log('WAV file written successfully');

      exec(`python ./python/stt.py ${tempFilePath}`, (error, stdout, stderr) => {
        if (error) {
          console.error("Error executing Python script:", error);
          return res.status(500).send("Internal Server Error");
        }
        console.log("Python script output:", stdout);
        translateText(fromLang, toLang, stdout, res);

        fs.unlinkSync(tempFilePath);
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/braille", upload.single("img"), async (req, res) => {
  try {
    const image = req.file;
    if (!image) {
      return res.status(400).json({ error: "Image data not provided" });
    }
    console.log(image);
    const imageBuffer = image.buffer;
    fs.writeFileSync('./python/test/testbraille.jpg', imageBuffer);
    exec(
      "python ./python/braille.py ./python/models/yolov8m.pt ./python/test/testbraille.jpg ./python/test/ ./python/models/best_model.pth",
      (error, stdout, stderr) => {
        if (error) {
          console.error("Error executing Python script:", error);
          return res.status(500).send("Internal Server Error");
        }
        // const imageData = fs.readFileSync("./python/test/output.jpg")
        // const base64Image = new Blob([imageData], { type: 'image/jpeg' });
        // // const base64Image = Buffer.from(imageData).toString('base64');
        // const imageURL = URL.createObjectURL(base64Image);
        // console.log(imageURL)
        // res.status(200).send({result:base64Image})
        fs.readFile('./python/test/output.jpg', (err, data) => {
          if (err) {
            console.error('Error reading file:', err);
            res.status(500).send('Error reading file');
            return;
          }
      
          res.setHeader('Content-Type', 'image/jpeg');
          res.send(data);
        });
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
