const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const modelManager = require('./modelManager');
const app = express();
const port = process.env.PORT || 3000;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File(
      { filename: 'log.log', format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )})
  ],
});

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('index.html');
});

app.post('/generate/aboveground', async (req, res) => {
  return await prepareRequest(req, res, modelManager.generateAboveground);
});

app.post('/generate/underground', async (req, res) => {
  return await prepareRequest(req, res, modelManager.generateUnderground);
});

const prepareRequest = async (req, res, generateFunction) => {
  if (!req.body || !req.body.file) {
    return res.status(400).send();
  }
  try {
    const image = req.body.file.replace(/^data:image\/jpeg;base64,/, "");
    const buffer = Buffer.from(image, 'base64');
    const generatedImage = await generateFunction(buffer);
    const generatedImagePath = path.resolve('./public/img/generated_maps/generated.jpeg');
    fs.writeFileSync(generatedImagePath, generatedImage);
    return res.sendFile(generatedImagePath);
  } catch (error) {
    logger.log('error', error.message);
    return res.send('error');
  }
}

app.listen(port, () => {
  try {
    modelManager.loadModel().then(loadedModel =>  logger.log('model loaded', loadedModel));
  } catch(error) {
    logger.log('error', error.message);
  }
  console.log(`Example app listening on port ${port}`);
});