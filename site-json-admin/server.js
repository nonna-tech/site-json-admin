const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(__dirname)); // serve o index.html e afins

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      const initial = { recados: [] };
      await fs.writeFile(DATA_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    throw err;
  }
}

async function writeData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Login didático (NÃO usar em produção)
const VALID_USER = 'user';
const VALID_PASS = '123456789';
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const ok = username === VALID_USER && password === VALID_PASS;
  if (ok) return res.json({ success: true });
  res.status(401).json({ success: false, message: 'Credenciais inválidas' });
});

// API
app.get('/api/recados', async (req, res) => {
  try { res.json((await readData()).recados); }
  catch { res.status(500).json({ error: 'Falha ao ler' }); }
});

app.post('/api/recados', async (req, res) => {
  try {
    const { texto } = req.body || {};
    if (!texto?.trim()) return res.status(400).json({ error: 'Texto é obrigatório' });
    const data = await readData();
    const nextId = data.recados.length ? Math.max(...data.recados.map(r => r.id)) + 1 : 1;
    const novo = { id: nextId, texto: texto.trim() };
    data.recados.push(novo);
    await writeData(data);
    res.status(201).json(novo);
  } catch { res.status(500).json({ error: 'Falha ao salvar' }); }
});

app.put('/api/recados/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { texto } = req.body || {};
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });
    if (!texto?.trim()) return res.status(400).json({ error: 'Texto é obrigatório' });
    const data = await readData();
    const idx = data.recados.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Não encontrado' });
    data.recados[idx].texto = texto.trim();
    await writeData(data);
    res.json(data.recados[idx]);
  } catch { res.status(500).json({ error: 'Falha ao atualizar' }); }
});

app.delete('/api/recados/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await readData();
    const before = data.recados.length;
    data.recados = data.recados.filter(r => r.id !== id);
    if (data.recados.length === before) return res.status(404).json({ error: 'Não encontrado' });
    await writeData(data);
    res.status(204).send();
  } catch { res.status(500).json({ error: 'Falha ao remover' }); }
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
