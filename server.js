// ========================= CONFIGURAÇÃO BÁSICA =========================
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// ========================= MIDDLEWARES =========================
app.use(express.json());

// 🔓 Libera acesso do GitHub Pages (CORS)
app.use(cors()); // libera todos os domínios (temporário para teste)


// ========================= CAMINHO DO ARQUIVO JSON =========================
const dataFile = path.join(__dirname, 'data.json');

// ========================= FUNÇÕES AUXILIARES =========================
async function readData() {
  try {
    const content = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { recados: [] };
  }
}

async function writeData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

// ========================= ROTAS PÚBLICAS =========================
app.get('/api/recados', async (req, res) => {
  const data = await readData();
  res.json(data.recados);
});

// ========================= ROTAS ADMIN (CRUD) =========================
app.post('/api/recados', async (req, res) => {
  const { texto } = req.body || {};
  if (!texto || texto.trim() === '') {
    return res.status(400).json({ error: 'Texto é obrigatório.' });
  }

  const data = await readData();
  const novo = {
    id: Date.now(),
    texto: texto.trim()
  };
  data.recados.push(novo);
  await writeData(data);
  res.status(201).json(novo);
});

app.put('/api/recados/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { texto } = req.body || {};
  const data = await readData();
  const idx = data.recados.findIndex(r => r.id === id);

  if (idx === -1)
    return res.status(404).json({ error: 'Não encontrado' });

  data.recados[idx].texto = texto.trim();
  await writeData(data);
  res.json(data.recados[idx]);
});

app.delete('/api/recados/:id', async (req, res) => {
  const id = Number(req.params.id);
  const data = await readData();
  const idx = data.recados.findIndex(r => r.id === id);

  if (idx === -1)
    return res.status(404).json({ error: 'Não encontrado' });

  data.recados.splice(idx, 1);
  await writeData(data);
  res.json({ success: true });
});

// ========================= LOGIN SIMPLES =========================
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'user' && password === '123456789') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Credenciais incorretas.' });
  }
});

// ========================= FRONTEND (HTML) =========================
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========================= INICIAR SERVIDOR =========================
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

