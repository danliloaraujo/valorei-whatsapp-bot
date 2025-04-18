
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Rota de verificação do Webhook da Meta
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'valorei-wh-token';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[META] Verificação recebida e aprovada!');
    res.status(200).send(challenge);
  } else {
    console.log('[META] Verificação falhou');
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  console.log('[META] Webhook recebido:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
