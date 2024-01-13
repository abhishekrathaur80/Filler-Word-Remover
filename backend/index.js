const express = require('express');
const multer = require('multer');
const fluentffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const ffmpegPath = require('ffmpeg-static');
const app = express();
const port = 3001;

app.use(cors());


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());


fluentffmpeg.setFfmpegPath(ffmpegPath);

app.post('/process-audio', upload.single('audio'), async (req, res) => {
  try {
  
    if (!req.file || !req.body.sensitivity) {
      return res.status(400).json({ success: false, message: 'Invalid request payload' });
    }

    const audioBuffer = req.file.buffer;

    if (!Buffer.isBuffer(audioBuffer)) {
      console.error('Invalid audio buffer:', audioBuffer);
      return res.status(400).json({ success: false, message: 'Invalid audio buffer' });
    }

    const sensitivity = parseFloat(req.body.sensitivity) || 0;


    console.log('Audio Buffer Size:', audioBuffer.length);


    const processedBuffer = await new Promise((resolve, reject) => {
      fluentffmpeg()
        .input('pipe:0')  
        .inputFormat('wav')  
        .audioFilter(`afade=out:st=${sensitivity},afade=in:st=${sensitivity + 5}`)
        .toFormat('wav')
        .on('end', () => {
          console.log('Audio processing complete');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error converting audio:', err);
          reject(err);
        })
        .input(audioBuffer) 
        .toBuffer();
    });

    res.json({ success: true, message: 'Processing complete', processedAudio: processedBuffer });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
