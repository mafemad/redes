const express = require("express");
const { Pool } = require("pg");
const os = require("os");

const app = express();
const port = 3000;

// Middleware para interpretar JSON e dados de formulário
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do banco de dados
const pool = new Pool({
  user: "admin",
  host: "postgres",
  database: "banco",
  password: "123456",
  port: 5432,
});

// Criar a tabela se não existir
pool.query(
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
  )`,
  (err) => {
    if (err) console.error("Erro ao criar tabela:", err);
  }
);

// Página inicial
app.get("/", async (req, res) => {
  res.send(`
    <h2>Servidor: ${os.hostname()}</h2>
    <a href="/users">Ver usuários</a> |
    <a href="/add-user">Adicionar usuário</a>
  `);
});

// Rota para listar usuários
app.get("/users", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM users");
    client.release();

    let listaUsuarios = result.rows.map(
      (u) => `<li>${u.id}: ${u.name} <a href='/edit-user?id=${u.id}'>Editar</a> | <a href='/delete-user?id=${u.id}'>Deletar</a></li>`
    ).join("");

    res.send(`
      <h2>Lista de Usuários</h2>
      <ul>${listaUsuarios}</ul>
      <a href="/">Voltar</a>
    `);
  } catch (error) {
    res.status(500).send("Erro ao buscar usuários: " + error.message);
  }
});

// Página para adicionar usuário
app.get("/add-user", (req, res) => {
  res.send(`
    <h2>Adicionar Usuário</h2>
    <form action="/add-user" method="POST">
      <input type="text" name="name" placeholder="Nome" required>
      <button type="submit">Adicionar</button>
    </form>
    <a href="/">Voltar</a>
  `);
});

// Rota para adicionar usuário (POST)
app.post("/add-user", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.send("Nome é obrigatório!");

  try {
    const client = await pool.connect();
    await client.query("INSERT INTO users (name) VALUES ($1)", [name]);
    client.release();
    res.redirect("/users");
  } catch (error) {
    res.status(500).send("Erro ao inserir no banco: " + error.message);
  }
});

// Página para editar usuário
app.get("/edit-user", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.redirect("/users");

  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM users WHERE id=$1", [id]);
    client.release();
    
    if (result.rows.length === 0) return res.send("Usuário não encontrado");

    const user = result.rows[0];
    res.send(`
      <h2>Editar Usuário</h2>
      <form action="/edit-user" method="POST">
        <input type="hidden" name="id" value="${user.id}">
        <input type="text" name="name" value="${user.name}" required>
        <button type="submit">Salvar</button>
      </form>
      <a href="/users">Cancelar</a>
    `);
  } catch (error) {
    res.status(500).send("Erro ao buscar usuário: " + error.message);
  }
});

// Rota para editar usuário (POST)
app.post("/edit-user", async (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) return res.redirect("/users");

  try {
    const client = await pool.connect();
    await client.query("UPDATE users SET name=$1 WHERE id=$2", [name, id]);
    client.release();
    res.redirect("/users");
  } catch (error) {
    res.status(500).send("Erro ao atualizar usuário: " + error.message);
  }
});

// Rota para deletar usuário
app.get("/delete-user", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.redirect("/users");

  try {
    const client = await pool.connect();
    await client.query("DELETE FROM users WHERE id=$1", [id]);
    client.release();
    res.redirect("/users");
  } catch (error) {
    res.status(500).send("Erro ao deletar usuário: " + error.message);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

