const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();
const respostas = require('./respostas');

const app = express();
app.use(bodyParser.json());

const token = process.env.WHATSAPP_TOKEN;
const verifyToken = process.env.VERIFY_TOKEN;
const phoneId = process.env.PHONE_NUMBER_ID;
const openaiKey = process.env.OPENAI_API_KEY;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function interpretarMensagem(msg) {
  const texto = msg.toLowerCase();

  if (texto.includes('venda') || texto.includes('vender') || texto.includes('crescer') ||
      texto.includes('faturamento') || texto.includes('atrair cliente') || texto.includes('marketing') ||
      texto.includes('leads') || texto.includes('reuniões') || texto.includes('estratégia comercial')) {
    return respostas.valoreiBusiness;
  }

  if (texto.includes('contratar') || texto.includes('vaga') || texto.includes('dev') ||
      texto.includes('engenheiro de software') || texto.includes('recrutamento') ||
      texto.includes('tech lead') || texto.includes('frontend') || texto.includes('backend')) {
    return respostas.valoreiTalents;
  }

  if (texto.includes('alocar') || texto.includes('freela') || texto.includes('terceirizar') ||
      texto.includes('consultor') || texto.includes('squad') || texto.includes('por projeto')) {
    return respostas.valoreiProfessionals;
  }

  if (texto.includes('oi') || texto.includes('olá') || texto.includes('bom dia')) {
    return respostas.saudacao;
  }

  return null;
}

async function gerarRespostaIA(pergunta) {
  const prompt = `
Você é o assistente da Valorei, uma empresa com três frentes:
1. Valorei Business - ajuda pequenas empresas a aumentarem as vendas com estratégias de marketing e vendas, cobrando só por resultado.
2. Valorei Talents - recrutamento de profissionais de TI, com foco em qualidade.
3. Valorei Professionals - alocação de profissionais de TI com agilidade e flexibilidade.

Responda de forma consultiva e próxima, como se estivesse conversando naturalmente com um cliente no WhatsApp.

Usuário: ${pergunta}
Bot:
  `;

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  }, {
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content;
}

app.post('/webhook', async (req, res) => {
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (message && message.type === 'text') {
    const from = message.from;
    const text = message.text.body;

    let resposta = interpretarMensagem(text);

    if (!resposta) {
      resposta = await gerarRespostaIA(text);
    }

    await delay(1200 + Math.random() * 800);

    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: from,
        text: { body: resposta }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  res.sendStatus(200);
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const tokenQuery = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && tokenQuery === verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.listen(10000, () => {
  console.log('Servidor rodando na porta 10000');
});