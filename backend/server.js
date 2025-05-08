const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, 'users.json');

function lerUsuarios() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return data ? JSON.parse(data) : [];
}

function salvarUsuarios(usuarios) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(usuarios, null, 2));
}

// Rota de cadastro
app.post('/api/cadastrar', (req, res) => {
  const novaEmpresa = { ...req.body, status: 'Fechada', produtos: [] };
  const usuarios = lerUsuarios();

  if (usuarios.find(u => u.email === novaEmpresa.email)) {
    return res.status(400).json({ error: 'Email já cadastrado.' });
  }

  usuarios.push(novaEmpresa);
  salvarUsuarios(usuarios);
  res.json({ mensagem: 'Empresa cadastrada com sucesso!' });
});

// Rota de login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const usuarios = lerUsuarios();
  const empresa = usuarios.find(u => u.email === email && u.senha === senha);

  if (!empresa) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  res.json({ empresa });
});

// Atualizar status (Aberta/Fechada)
app.post('/api/status', (req, res) => {
  const { email, status } = req.body;
  const usuarios = lerUsuarios();
  const empresa = usuarios.find(u => u.email === email);

  if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

  empresa.status = status;
  salvarUsuarios(usuarios);
  res.json({ mensagem: 'Status atualizado com sucesso.' });
});

// Adicionar produto
app.post('/api/adicionar-produto', (req, res) => {
  const { email, nome, descricao, preco, imagem } = req.body;
  const usuarios = lerUsuarios();
  const empresa = usuarios.find(u => u.email === email);

  if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

  empresa.produtos.push({ nome, descricao, preco, imagem });
  salvarUsuarios(usuarios);
  res.json({ mensagem: 'Produto adicionado com sucesso.' });
});
// Adicionar produto
app.post('/api/adicionar-produto', (req, res) => {
  const { email, nome, descricao, preco, imagem } = req.body;
  const users = lerUsuarios();
  const user = users.find(u => u.email === email);
  if (user) {
    user.produtos.push({ nome, descricao, preco, imagem });
    salvarUsuarios(users);
    return res.sendStatus(200);
  }
  res.sendStatus(404);
});

// Editar produto
app.post('/api/editar-produto', (req, res) => {
  const { email, nome, descricao, preco, imagem, index } = req.body;
  const users = lerUsuarios();
  const user = users.find(u => u.email === email);
  if (user && user.produtos[index]) {
    user.produtos[index] = { nome, descricao, preco, imagem };
    salvarUsuarios(users);
    return res.sendStatus(200);
  }
  res.sendStatus(404);
});


// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
