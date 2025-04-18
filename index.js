const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();
const respostas = require('./respostas');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Servidor rodando na porta ' + PORT);
});

app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object) {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (message && message.type === 'text') {
      const from = message.from;
      const text = message.text.body.toLowerCase();

      let resposta = '';

      if (text.includes('vender') || text.includes('marketing')) {
        resposta = respostas.business;
      } else if (text.includes('contratar') || text.includes('dev')) {
        resposta = respostas.talents;
      } else if (text.includes('alocar') || text.includes('terceirizar')) {
        resposta = respostas.professionals;
      } else if (text.includes('oi') || text.includes('olá') || text.includes('bom dia')) {
        resposta = respostas.saudacao;
      } else {
        resposta = respostas.fallback;
      }

      await axios({
        method: 'POST',
        url: `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          messaging_product: 'whatsapp',
          to: from,
          text: { body: resposta }
        }
      });
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});