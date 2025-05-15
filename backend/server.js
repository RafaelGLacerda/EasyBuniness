const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 📁 Funções utilitárias
function lerUsuarios() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return { empresas: [], pessoas: [] };
    }
    const conteudo = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(conteudo);
  } catch (err) {
    console.error('Erro ao ler o arquivo users.json:', err);
    return { empresas: [], pessoas: [] };
  }
}

function salvarUsuarios(dados) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(dados, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar o arquivo users.json:', err);
  }
}

// 📦 Rotas de empresa
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
  const { email, nome, descricao, preco, imagem, quantidade } = req.body;
  const data = lerUsuarios();

  const empresa = data.empresas.find(e => e.email === email);
  if (!empresa) {
    return res.status(404).json({ error: 'Empresa não encontrada.' });
  }

  empresa.produtos.push({ nome, descricao, preco: parseFloat(preco), imagem, quantidade: parseInt(quantidade) });
  salvarUsuarios(data);
  res.json({ mensagem: 'Produto adicionado com sucesso.' });
});

app.post('/api/editar-produto', (req, res) => {
 const { email, index, nome, descricao, preco, imagem, quantidade } = req.body;
  const data = lerUsuarios();

  const empresa = data.empresas.find(e => e.email === email);
  if (!empresa || typeof index !== 'number' || !empresa.produtos[index]) {
    return res.status(404).json({ error: 'Produto ou empresa não encontrada.' });
  }


empresa.produtos[index] = {
  nome,
  descricao,
  preco: parseFloat(preco),
  imagem,
  quantidade: parseInt(quantidade)
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

app.post('/api/atualizarEmpresa', (req, res) => {
  const { email, nome, telefone, contatos, descricao, endereco } = req.body;
  const data = lerUsuarios();

  if (!email) {
    return res.status(400).json({ error: 'O campo \"email\" \u00e9 obrigat\u00f3rio.' });
  }

  const index = data.empresas.findIndex(e => e.email === email);
  if (index === -1) {
    return res.status(404).json({ error: 'Empresa n\u00e3o encontrada para o email informado.' });
  }

  data.empresas[index] = {
    ...data.empresas[index],
    nome: nome ?? data.empresas[index].nome,
    telefone: telefone ?? data.empresas[index].telefone,
    contatos: contatos ?? data.empresas[index].contatos,
    descricao: descricao ?? data.empresas[index].descricao,
    endereco: endereco ?? data.empresas[index].endereco
  };

  salvarUsuarios(data);

  res.status(200).json({
    success: true,
    mensagem: '🟢 Dados da empresa atualizados com sucesso.'
  });
});


// 👤 Rotas de usuário (Pessoa física)
app.post('/cadastro-usuario', (req, res) => {
  const novoUsuario = req.body;

  if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  const dados = lerUsuarios();

  if (dados.pessoas.find(p => p.email === novoUsuario.email)) {
    return res.status(400).json({ error: 'Email já cadastrado.' });
  }

  dados.pessoas.push(novoUsuario);
  salvarUsuarios(dados);
  res.json({ success: true, mensagem: 'Usuário cadastrado com sucesso!' });
});

app.post('/login-usuario', (req, res) => {
  const { email, senha } = req.body;
  const dados = lerUsuarios();

  const usuario = dados.pessoas.find(p => p.email === email && p.senha === senha);
  if (!usuario) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  res.json({ success: true, usuario });
});

app.post('/api/atualizarPessoa', (req, res) => {
  try {
    const { email, nome, telefone, contato } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const dados = lerUsuarios();

    if (!dados || !Array.isArray(dados.pessoas)) {
      return res.status(500).json({ error: 'Arquivo de usuários corrompido ou inválido.' });
    }

    const index = dados.pessoas.findIndex(p => p.email === email);
    if (index === -1) {
      return res.status(404).json({ error: 'Pessoa não encontrada.' });
    }

    const pessoaAntiga = dados.pessoas[index];
    const pessoaAtualizada = {
      ...pessoaAntiga,
      nome: nome ?? pessoaAntiga.nome,
      telefone: telefone ?? pessoaAntiga.telefone,
      contato: contato ?? pessoaAntiga.contato
    };

    dados.pessoas[index] = pessoaAtualizada;

    salvarUsuarios(dados);
    console.log(`Pessoa atualizada: ${email}`);
    return res.status(200).json({ mensagem: 'Pessoa atualizada com sucesso.' });
  } catch (erro) {
    console.error('Erro ao atualizar pessoa:', erro);
    return res.status(500).json({ error: 'Erro interno do servidor ao atualizar os dados.' });
  }
});

// 🌐 Rotas públicas
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

// 🏁 Index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
