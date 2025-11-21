const express = require('express');
const exphbs = require('express-handlebars');
const PORT = 3000
const app = express();

// ===================================
// CONFIGURAÇÃO DO EXPRESS E HANDLEBARS
// ===================================
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.engine('handlebars', exphbs.engine({ 
    defaultLayout: false, 
    helpers: {
        json: (context) => JSON.stringify(context),
        // Helper simples para comparação no handlebars
        eq: (a, b) => a === b 
    } 
}));
app.set('view engine', 'handlebars');
app.use(express.static('public')); // Serve o CSS

// ================== DADOS ==================
let nivel = { 1:'Leitor/Cliente', 2:'Funcionário', 3:'Bibliotecário' };

let usuarios = [
    {id:1, nome:"Pessoa1", cpf:"123456789-01",idade: 16,nivel:1},
    {id:2, nome:"Pessoa2", cpf:"123456759-01",idade: 18,nivel:1},
    {id:3, nome:"Pessoa3", cpf:"123536759-01",idade: 29,nivel:3}
];

let bibliotecas = [
    {id: 0, cnpj: '2y9167391693816', acervo:120, cep:'9873278-399'}
];

let acervo = [
    { id: 0, idlivro: 0, idbiblioteca: 0, idUsuario: 1 }, 
    { id: 1, idlivro: 0, idbiblioteca: 0, idUsuario: -1 },
    { id: 2, idlivro: 0, idbiblioteca: 0, idUsuario: -1 },
    { id: 3, idlivro: 0, idbiblioteca: 0, idUsuario: -1 },
    { id: 4, idlivro: 0, idbiblioteca: 0, idUsuario: -1 },
    { id: 5, idlivro: 0, idbiblioteca: 0, idUsuario: -1 },
    { id: 6, idlivro: 0, idbiblioteca: 0, idUsuario: -1 },
    { id: 7, idlivro: 0, idbiblioteca: 0, idUsuario: -1 },
    { id: 8, idlivro: 0, idbiblioteca: 0, idUsuario: -1 },
    { id: 9, idlivro: 0, idbiblioteca: 0, idUsuario: -1 },
];

let livros = [
    {id: 0, nome: 'livro de romance', categoria: 'romance', tags: ['classico', 'finaltriste'], quantidade_total: 10},
];

let qtdUsuarios = usuarios.length;
let qtdBibliotecas = bibliotecas.length;
let qtdLivros = livros.length;
let qtdAcervo = acervo.length;

// ================== ROTAS DE VISUALIZAÇÃO (GET) ==================

app.get('/', (req, res) => {
    res.render('home');
});

// --- LIVROS ---
app.get('/livros', (req, res) => {
    res.render('livros', { livros, bibliotecas }); // Passa bibliotecas para o select do form
});

app.get('/livros/:id', (req, res) => {
    const livroId = parseInt(req.params.id);
    const livro = livros.find(l => l.id === livroId);
    if (livro) {
        // Formata tags para string para exibir no input
        const livroView = { ...livro, tagsString: Array.isArray(livro.tags) ? livro.tags.join(',') : livro.tags };
        res.render('livro_detalhe', { livro: livroView, bibliotecas });
    } else {
        res.redirect('/livros');
    }
});

// --- BIBLIOTECAS ---
app.get('/bibliotecas', (req, res) => {
    res.render('bibliotecas', { bibliotecas });
});

app.get('/bibliotecas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const biblioteca = bibliotecas.find(b => b.id === id);
    if (biblioteca) res.render('biblioteca_detalhe', { biblioteca });
    else res.redirect('/bibliotecas');
});

// --- USUÁRIOS ---
app.get('/usuarios', (req, res) => {
    // Transforma o objeto 'nivel' em array para usar no select
    const niveisArr = Object.entries(nivel).map(([k, v]) => ({ id: k, nome: v }));
    // Adiciona o label do nivel no objeto usuario para exibir na tabela
    const usuariosView = usuarios.map(u => ({...u, nivelLabel: nivel[u.nivel]}));
    res.render('usuarios', { usuarios: usuariosView, niveis: niveisArr });
});

app.get('/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const usuario = usuarios.find(u => u.id === id);
    const niveisArr = Object.entries(nivel).map(([k, v]) => ({ id: parseInt(k), nome: v }));
    if (usuario) res.render('usuario_detalhe', { usuario, niveis: niveisArr });
    else res.redirect('/usuarios');
});

// --- ACERVO ---
app.get('/acervo', (req, res) => {
    // Enriquece o acervo com nomes de livros e bibliotecas para ficar legível
    const acervoView = acervo.map(item => {
        const l = livros.find(liv => liv.id === item.idlivro);
        const b = bibliotecas.find(bib => bib.id === item.idbiblioteca);
        return {
            ...item,
            nomeLivro: l ? l.nome : 'Desconhecido',
            cnpjBiblioteca: b ? b.cnpj : 'Desconhecido',
            status: item.idUsuario === -1 ? 'Disponível' : `Emprestado (User ${item.idUsuario})`
        };
    });
    res.render('acervo', { acervo: acervoView });
});

app.get('/acervo/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const item = acervo.find(a => a.id === id);
    if (item) {
        const l = livros.find(liv => liv.id === item.idlivro);
        const itemName = l ? l.nome : 'Item #' + id;
        res.render('acervo_detalhe', { item, itemName });
    } else {
        res.redirect('/acervo');
    }
});

// ================== ROTAS DE API (CRUD LOGIC) ==================
// (Mantidas conforme original, retornando JSON, usadas via fetch no front)

// POST /livros/new
app.post('/livros/new', (req, res) => {
    const { nome, categoria, tags, quantidade_total, idbiblioteca } = req.body;
    if (!nome || !categoria || !tags || quantidade_total === undefined || idbiblioteca === undefined) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    };
    const newLivroId = qtdLivros;
    const qtdTotal = parseInt(quantidade_total);
    const newLivro = {
        id: newLivroId,
        nome,
        categoria,
        tags: Array.isArray(tags) ? tags : tags.split(','),
        quantidade_total: qtdTotal,
    };
    for (let i = 0; i < qtdTotal; i++) {
        acervo.push({
            id: qtdAcervo, idlivro: newLivroId, idbiblioteca: parseInt(idbiblioteca), idUsuario: -1
        });
        qtdAcervo++;
    }
    qtdLivros++;
    livros.push(newLivro);
    res.status(201).json(newLivro);
});

// PUT /livros/:id
app.put('/livros/:id', (req, res) => {
    const livroId = parseInt(req.params.id);
    const livroIndex = livros.findIndex(l => l.id === livroId);
    if (livroIndex !== -1) {
        const livro = livros[livroIndex];
        const { nome, categoria, tags, quantidade_total, idbiblioteca } = req.body;
        const oldQuantidade = livro.quantidade_total;

        if (nome) livro.nome = nome;
        if (categoria) livro.categoria = categoria;
        if (tags) livro.tags = Array.isArray(tags) ? tags : tags.split(',');

        if (quantidade_total !== undefined) {
            const newQuantidade = parseInt(quantidade_total);
            const diff = newQuantidade - oldQuantidade;
            livro.quantidade_total = newQuantidade;

            if (diff > 0) {
                const libId = idbiblioteca !== undefined ? parseInt(idbiblioteca) : (bibliotecas[0] ? bibliotecas[0].id : 0);
                for (let i = 0; i < diff; i++) {
                    acervo.push({ id: qtdAcervo, idlivro: livroId, idbiblioteca: libId, idUsuario: -1 });
                    qtdAcervo++;
                }
            } else if (diff < 0) {
                const copiasDisponiveis = acervo.filter(c => c.idlivro === livroId && c.idUsuario === -1);
                const remover = Math.abs(diff);
                if (copiasDisponiveis.length < remover) {
                    livro.quantidade_total = oldQuantidade; // Revert
                    return res.status(400).json({ error: 'Não há cópias disponíveis suficientes para remover.' });
                }
                for (let i = 0; i < remover; i++) {
                    const idx = acervo.findIndex(c => c.id === copiasDisponiveis[i].id);
                    if (idx !== -1) acervo.splice(idx, 1);
                }
            }
        }
        res.json(livro);
    } else {
        res.status(404).json({ error: 'Livro não encontrado!' });
    }
});

// DELETE /livros/:id
app.delete('/livros/:id', (req, res) => {
    const livroId = parseInt(req.params.id);
    const livroIndex = livros.findIndex(l => l.id === livroId);
    if (livroIndex !== -1) {
        const [livroDeletado] = livros.splice(livroIndex, 1);
        acervo = acervo.filter(c => c.idlivro !== livroId);
        res.json({ mensagem: 'Deletado', livro: livroDeletado });
    } else {
        res.status(404).json({ error: 'Não encontrado!' });
    }
});

// POST /usuarios
app.post('/usuarios', (req, res) => {
    const { nome, cpf, idade, nivel } = req.body;
    if (!nome || !cpf || !idade || !nivel) return res.status(400).json({ error: 'Dados incompletos' });
    const newUsuario = { id: qtdUsuarios, nome, cpf, idade: parseInt(idade), nivel: parseInt(nivel) };
    qtdUsuarios++;
    usuarios.push(newUsuario);
    res.status(201).json(newUsuario);
});

// PUT /usuarios/:id
app.put('/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const u = usuarios.find(x => x.id === id);
    if (u) {
        const { nome, cpf, idade, nivel } = req.body;
        if(nome) u.nome = nome;
        if(cpf) u.cpf = cpf;
        if(idade) u.idade = parseInt(idade);
        if(nivel) u.nivel = parseInt(nivel);
        res.json(u);
    } else res.status(404).json({error: 'Não encontrado'});
});

// DELETE /usuarios/:id
app.delete('/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const idx = usuarios.findIndex(u => u.id === id);
    if (idx !== -1) {
        usuarios.splice(idx, 1);
        res.json({mensagem: 'Deletado'});
    } else res.status(404).json({error: 'Não encontrado'});
});

// POST /bibliotecas
app.post('/bibliotecas', (req, res) => {
    const { cnpj, acervo, cep } = req.body;
    if (!cnpj || !acervo || !cep) return res.status(400).json({error: 'Dados incompletos'});
    const newBib = { id: qtdBibliotecas, cnpj, acervo: parseInt(acervo), cep };
    qtdBibliotecas++;
    bibliotecas.push(newBib);
    res.status(201).json(newBib);
});

// PUT /bibliotecas/:id
app.put('/bibliotecas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const b = bibliotecas.find(x => x.id === id);
    if(b) {
        const { cnpj, acervo, cep } = req.body;
        if(cnpj) b.cnpj = cnpj;
        if(acervo) b.acervo = parseInt(acervo);
        if(cep) b.cep = cep;
        res.json(b);
    } else res.status(404).json({error: 'Não encontrada'});
});

// DELETE /bibliotecas/:id
app.delete('/bibliotecas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const idx = bibliotecas.findIndex(b => b.id === id);
    if(idx !== -1) {
        bibliotecas.splice(idx, 1);
        res.json({mensagem: 'Deletada'});
    } else res.status(404).json({error: 'Não encontrada'});
});

// PUT /acervo/status/:id
app.put('/acervo/status/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const copia = acervo.find(a => a.id === id);
    const { idUsuario } = req.body;
    if(copia && idUsuario !== undefined) {
        const uId = parseInt(idUsuario);
        // (Validações simplificadas para caber na resposta, mantendo lógica original)
        if (uId > 0 && !usuarios.some(u => u.id === uId)) return res.status(404).json({error: 'User not found'});
        copia.idUsuario = uId;
        res.json(copia);
    } else res.status(404).json({error: 'Erro'});
});

app.listen(PORT, () => {
    console.log(`Servidor em execução na porta http://localhost:${PORT}`);
});