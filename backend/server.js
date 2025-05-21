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
    const { email, nome, telefone, contato, cpf, endereco } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório.' });
    }

    const dados = lerUsuarios();

    const index = dados.pessoas.findIndex(p => p.email === email);
    if (index === -1) {
      return res.status(404).json({ error: 'Pessoa não encontrada.' });
    }

    const pessoaAntiga = dados.pessoas[index];
    const pessoaAtualizada = {
      ...pessoaAntiga,
      nome: nome ?? pessoaAntiga.nome,
      telefone: telefone ?? pessoaAntiga.telefone,
      contato: contato ?? pessoaAntiga.contato,
      cpf: cpf ?? pessoaAntiga.cpf,
      endereco: endereco ?? pessoaAntiga.endereco
    };

    dados.pessoas[index] = pessoaAtualizada;

    salvarUsuarios(dados);
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


// 📌 Rota 1 - Adicionar item ao carrinho
app.post('/api/carrinho/adicionar', (req, res) => {
  const { emailUsuario, empresaEmail, produtoIndex, quantidade } = req.body;
  const data = lerUsuarios();

  const usuario = data.pessoas.find(p => p.email === emailUsuario);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

  if (!usuario.carrinho) usuario.carrinho = [];

  usuario.carrinho.push({ empresaEmail, produtoIndex, quantidade });
  salvarUsuarios(data);
  res.json({ mensagem: 'Item adicionado ao carrinho com sucesso.' });
});

// 📌 Rota 2 - Obter carrinho do usuário
app.get('/api/carrinho/:email', (req, res) => {
  const email = req.params.email;
  const data = lerUsuarios();

  const usuario = data.pessoas.find(p => p.email === email);
  if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

  res.json({ carrinho: usuario.carrinho || [] });
});


// 📌 Rota 3 
app.post('/api/compras/finalizar', (req, res) => {
  try {
    const { emailUsuario } = req.body;
    const dados = lerUsuarios();

    const usuario = dados.pessoas.find(p => p.email === emailUsuario);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (!usuario.carrinho) usuario.carrinho = [];
    if (!usuario.compras) usuario.compras = [];

    const carrinho = usuario.carrinho;
    if (carrinho.length === 0) return res.status(400).json({ error: 'Carrinho está vazio.' });

    const produtosPorEmpresa = {};

    for (let item of carrinho) {
      const empresa = dados.empresas.find(e => e.email === item.empresaEmail);
      if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

      if (!empresa.produtos) empresa.produtos = [];

      const produto = empresa.produtos[item.produtoIndex];
      if (!produto) return res.status(404).json({ error: 'Produto não encontrado.' });

      if (produto.quantidade < item.quantidade) {
        return res.status(400).json({ error: `Estoque insuficiente para ${produto.nome}` });
      }

      if (!produtosPorEmpresa[item.empresaEmail]) {
        produtosPorEmpresa[item.empresaEmail] = [];
      }

      produtosPorEmpresa[item.empresaEmail].push({
        nome: produto.nome,
        preco: produto.preco,
        quantidade: item.quantidade
      });

      produto.quantidade -= item.quantidade;
    }

    const dataAtual = new Date().toISOString();

    for (let empresaEmail in produtosPorEmpresa) {
      const produtos = produtosPorEmpresa[empresaEmail];

      const compraPessoa = {
        empresaEmail,
        produtos,
        status: "Pendente",
        observacao: "",
        data: dataAtual
      };

      const empresa = dados.empresas.find(e => e.email === empresaEmail);
      if (!empresa.comprasRecebidas) empresa.comprasRecebidas = [];

      const compraEmpresa = {
        usuario: {
          nome: usuario.nome,
          email: usuario.email,
          endereco: usuario.endereco,
          contato: usuario.contato
        },
        produtos,
        status: "Pendente",
        observacao: "",
        data: dataAtual
      };

      usuario.compras.push(compraPessoa);
      empresa.comprasRecebidas.push(compraEmpresa);
    }

    usuario.carrinho = [];

    salvarUsuarios(dados);
    res.json({ mensagem: "Compra finalizada e enviada para as empresas." });

  } catch (err) {
    console.error("Erro interno ao finalizar compra:", err);
    res.status(500).json({ error: "Erro interno ao finalizar a compra." });
  }
});





// 📌 Rota 4 - Ver compras recebidas por empresa
app.get('/api/compras/empresa/:email', (req, res) => {
  const data = lerUsuarios();
  const empresa = data.empresas.find(e => e.email === req.params.email);
  if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada.' });

  res.json({ comprasRecebidas: empresa.comprasRecebidas || [] });
});

// 📌 Rota 5 - Empresa responde (aceitar ou indeferir compra)
app.post('/api/compras/resposta', (req, res) => {
  const { emailEmpresa, indexPedido, status, observacao } = req.body;
  const dados = lerUsuarios();

  const empresa = dados.empresas.find(e => e.email === emailEmpresa);
  if (!empresa || !empresa.comprasRecebidas[indexPedido]) {
    return res.status(404).json({ error: 'Pedido não encontrado para esta empresa.' });
  }

  const pedido = empresa.comprasRecebidas[indexPedido];
  pedido.status = status;
  pedido.observacao = observacao;

  // Encontrar o usuário e atualizar o pedido correspondente
  const pessoa = dados.pessoas.find(p => p.email === pedido.usuario.email);
  if (pessoa) {
    const pedidoPessoa = pessoa.compras.find(
      c => c.empresaEmail === emailEmpresa &&
           c.data === pedido.data &&
           JSON.stringify(c.produtos) === JSON.stringify(pedido.produtos)
    );

    if (pedidoPessoa) {
      pedidoPessoa.status = status;
      pedidoPessoa.observacao = observacao;
    }
  }

  salvarUsuarios(dados);
  res.json({ mensagem: "Pedido atualizado com sucesso." });
});





app.post('/api/carrinho/atualizar-quantidade', (req, res) => {
  const { emailUsuario, produtoIndex, delta } = req.body;
  const data = lerUsuarios();

  const usuario = data.pessoas.find(p => p.email === emailUsuario);
  if (!usuario || !usuario.carrinho || produtoIndex >= usuario.carrinho.length) {
    return res.status(404).json({ error: 'Usuário ou item não encontrado' });
  }

  usuario.carrinho[produtoIndex].quantidade += delta;
  if (usuario.carrinho[produtoIndex].quantidade < 1) {
    usuario.carrinho[produtoIndex].quantidade = 1;
  }

  salvarUsuarios(data);
  res.json({ mensagem: 'Quantidade atualizada' });
});

app.post('/api/carrinho/remover', (req, res) => {
  const { emailUsuario, produtoIndex } = req.body;
  const data = lerUsuarios();

  const usuario = data.pessoas.find(p => p.email === emailUsuario);
  if (!usuario || !usuario.carrinho || produtoIndex >= usuario.carrinho.length) {
    return res.status(404).json({ error: 'Usuário ou item não encontrado' });
  }

  usuario.carrinho.splice(produtoIndex, 1);
  salvarUsuarios(data);
  res.json({ mensagem: 'Item removido do carrinho.' });
});

// 📌 Rota 6 - Ver compras da pessoa
app.post('/api/compras/pessoa/:email', (req, res) => {
  const data = lerUsuarios();
  const pessoa = data.pessoas.find(p => p.email === req.params.email);
  if (!pessoa) return res.status(404).json({ error: 'Pessoa não encontrada.' });

  res.json({ compras: pessoa.compras || [] });
});


// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});