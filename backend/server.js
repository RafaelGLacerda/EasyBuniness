const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =====================================
// 🔧 Funções utilitárias
// =====================================
function lerUsuarios() {
  if (!fs.existsSync(USERS_FILE)) {
    return { empresas: [], pessoas: [] };
  }
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data) || { empresas: [], pessoas: [] };
  } catch (error) {
    console.error('Erro ao ler users.json:', error);
    return { empresas: [], pessoas: [] };
  }
}

function salvarUsuarios(data) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar users.json:', error);
  }
}

// =====================================
// 📦 ROTAS DE EMPRESA
// =====================================

app.post('/api/cadastrar', (req, res) => {
  const novaEmpresa = { ...req.body, status: 'Fechada', produtos: [] };
  const data = lerUsuarios();

  if (data.empresas.find(e => e.email === novaEmpresa.email)) {
    return res.status(400).json({ error: 'Email já cadastrado.' });
  }

  data.empresas.push(novaEmpresa);
  salvarUsuarios(data);
  res.json({ mensagem: 'Empresa cadastrada com sucesso!' });
});

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const data = lerUsuarios();

  const empresa = data.empresas.find(e => e.email === email && e.senha === senha);
  if (!empresa) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const index = data.empresas.findIndex(e => e.email === email);
  res.json({ empresa, index });
});

app.post('/api/status', (req, res) => {
  const { email, status } = req.body;
  const data = lerUsuarios();

  const empresa = data.empresas.find(e => e.email === email);
  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  empresa.status = status;
  salvarUsuarios(data);
  res.json({ mensagem: 'Status atualizado com sucesso.' });
});

app.post('/api/adicionar-produto', (req, res) => {
  const { email, nome, descricao, preco, imagem } = req.body;
  const data = lerUsuarios();

  const empresa = data.empresas.find(e => e.email === email);
  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  empresa.produtos.push({ nome, descricao, preco: parseFloat(preco), imagem });
  salvarUsuarios(data);
  res.json({ mensagem: 'Produto adicionado com sucesso.' });
});

app.post('/api/editar-produto', (req, res) => {
  const { email, index, nome, descricao, preco, imagem } = req.body;
  const data = lerUsuarios();

  const empresa = data.empresas.find(e => e.email === email);
  if (!empresa || typeof index !== 'number' || !empresa.produtos[index]) {
    return res.status(404).json({ error: 'Produto ou empresa não encontrada.' });
  }

  empresa.produtos[index] = {
    nome,
    descricao,
    preco: parseFloat(preco),
    imagem
  };

  salvarUsuarios(data);
  res.json({ mensagem: 'Produto editado com sucesso.' });
});

app.post('/api/excluir-produto', (req, res) => {
  const { email, index } = req.body;
  const data = lerUsuarios();

  const empresa = data.empresas.find(e => e.email === email);
  if (!empresa || typeof index !== 'number' || !empresa.produtos[index]) {
    return res.status(404).json({ error: 'Produto ou empresa não encontrada.' });
  }

  empresa.produtos.splice(index, 1);
  salvarUsuarios(data);
  res.json({ mensagem: 'Produto excluído com sucesso.' });
});

// =====================================
// 👤 ROTAS DE USUÁRIO (Pessoas físicas)
// =====================================

app.post('/cadastro-usuario', (req, res) => {
  const novoUsuario = req.body;
  const data = lerUsuarios();

  if (data.pessoas.find(u => u.email === novoUsuario.email)) {
    return res.status(400).json({ error: 'Email já cadastrado.' });
  }

  data.pessoas.push(novoUsuario);
  salvarUsuarios(data);
  res.json({ success: true, mensagem: 'Usuário cadastrado com sucesso!' });
});

app.post('/login-usuario', (req, res) => {
  const { email, senha } = req.body;
  const data = lerUsuarios();

  const usuario = data.pessoas.find(u => u.email === email && u.senha === senha);
  if (!usuario) {
    return res.status(401).json({ success: false, error: 'Credenciais inválidas.' });
  }

  res.json({ success: true, usuario });
});

// =====================================
// 🌐 ROTAS PÚBLICAS
// =====================================

app.get('/empresas', (req, res) => {
  const data = lerUsuarios();
  const empresas = data.empresas.map(({ senha, ...resto }) => resto);
  res.json(empresas);
});

app.get('/empresas/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const data = lerUsuarios();

  if (isNaN(index) || index < 0 || index >= data.empresas.length) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  const { senha, ...empresaSemSenha } = data.empresas[index];
  res.json(empresaSemSenha);
});

app.get('/empresa-por-email/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const data = lerUsuarios();

  const empresa = data.empresas.find(e => e.email === email);
  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  const { senha, ...empresaSemSenha } = empresa;
  res.json(empresaSemSenha);
});

// =====================================
// 🚀 INICIAR SERVIDOR
// =====================================
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em: http://localhost:${PORT}`);
});
