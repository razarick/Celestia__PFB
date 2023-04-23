const { exec } = require('child_process');
const express = require('express');
require('dotenv').config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

const serverUrl = process.env.SERVER_URL || 'http://localhost';
const serverPort = process.env.SERVER_PORT || 26659;

app.post('/', (req, res) => {
  const namespaceId = req.body.namespace_id;
  const data = req.body.message;
  if (namespaceId && data) {
    const command = `curl --header "Content-Type: application/json" --request POST --data '{"namespace_id":"${namespaceId}","data":"${data}","gas_limit": 80000,"fee":2000}' ${serverUrl}:${serverPort}/submit_pfb`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
        return;
      }
      try {
        const parsedOutput = JSON.parse(stdout);
        const { height, txhash } = parsedOutput;
        const signer = parsedOutput.logs[0].events[0].attributes[2].value;
        const result = {
          blockHeight: height,
          transactionHash: txhash,
          namespaceId: namespaceId,
          dataHex: data,
          signer,
          parsedOutput,
        };
        console.log(result)
        res.status(200).send(JSON.stringify(result, null, 2))
      } catch (e) {
        res.status(500).json(`Namespace ID: ${namespaceId}\nData Hex: ${data}\n\n\n${stdout}`);
        console.log(e)
      }
    });
  } else {
    res.status(400).json({ message: 'Invalid request' });
  }
});

app.listen(process.env.APP_PORT || 4010, () => {
  console.log(`Server is listening on port ${process.env.APP_PORT || 4010}`);
});