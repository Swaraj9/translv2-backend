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

app.post("/filetranslate", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }
    const fromLang = "en"
    const toLang = "hi"
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

app.post("/fileimg", upload.single("img"), async (req, res) => {
  try {
    const image = req.file;
    const fromLang = "en"
    const toLang = "hi"
    if (!image) {
      return res.status(400).json({ error: "Image data not provided" });
    }
    console.log(image);

    // const img = fs.readFileSync("../python/test/ocr3.jpeg")
    // console.log(img)
    tesseract
      .recognize(image.buffer, "eng")
      .then((text) => {
        console.log("Result:", text.data.text);
        translateText(fromLang, toLang, text.data.text, res);
      })
      .catch((error) => {
        console.log(error.message);
      });

    res.status(200).send({
      // result: `Translated data from ${source} to ${target}`
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/fileaudio", upload.single("audio"), async (req, res) => {
  try {
    const audio = req.file;
    const fromLang = "en"
    const toLang = "hi"
    if (!audio) {
      return res.status(400).json({ error: "audio data not provided" });
    }
    console.log(audio);

    exec(
      "python ./python/stt.py ./python/test.wav",
      (error, stdout, stderr) => {
        if (error) {
          console.error("Error executing Python script:", error);
          return res.status(500).send("Internal Server Error");
        }
        console.log("Python script output:", stdout);
        translateText(fromLang, toLang, stdout, res);
      }
    );
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/braille", upload.single("img"), async (req, res) => {
  try {
    // const image = req.file;
    // if (!image) {
    //   return res.status(400).json({ error: "Image data not provided" });
    // }
    // console.log(image);
    // const imageBuffer = image.buffer;
    // fs.writeFileSync('./python/test/testbraille.jpg', imageBuffer);
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
