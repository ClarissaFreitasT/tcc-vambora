const express = require("express");
const {
    criarUsuario,
    loginUsuario
} = require("./users");

const {
    criarRoteiro,
    publicarRoteiro,
    atualizarRoteiro,
    deletarRoteiro
} = require("./roteiro");

const {
    criarDia,
    listarDiasDoRoteiro
} = require("./dia");

const {
    criarItem
} = require("./item");

const app = express();
app.use(express.json());
const PORT = 3000;

// Rotas para usuários
app.post("/registrar", (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        const user = criarUsuario(nome, email, senha);

        res.status(201).json({
            message: "Usuário registrado com sucesso!",
            user
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

app.post("/login", (req, res) => {
    try {
        const { email, senha } = req.body;

        const user = loginUsuario(email, senha);

        res.json({
            message: "Login realizado com sucesso!",
            user
        });
    } catch (error) {
        res.status(401).send(error.message);
    }
});

// Rotas para roteiros
app.post("/roteiros", (req, res) => {
    try {
        const { nome, lugares, data } = req.body;

        const roteiro = criarRoteiro(nome, lugares, data);

        res.status(201).json(roteiro);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

app.post("/roteiros/:id/publicar", (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const roteiro = publicarRoteiro(id);

        res.json(roteiro);
    } catch (error) {
        res.status(404).send(error.message);
    }
});

app.patch("/roteiros/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nome, lugares, data } = req.body;

        const roteiro = atualizarRoteiro(id, nome, lugares, data);

        res.json(roteiro);
    } catch (error) {
        res.status(404).send(error.message);
    }
});

app.delete("/roteiros/:id", (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const roteiro = deletarRoteiro(id);

        res.json(roteiro);
    } catch (error) {
        res.status(404).send(error.message);
    }
});

app.post("/roteiros/:roteiroId/dias", (req, res) => {
    try {
        const roteiroId = parseInt(req.params.roteiroId);
        const { numeroDia, titulo } = req.body; 

        const dia = criarDia(roteiroId, numeroDia, titulo);

        res.status(201).json(dia);
    } catch (error) {
        res.status(400).send(error.message);
    }

});

app.get("/roteiros/:roteiroId/dias", (req, res) => {
    try {
        const roteiroId = parseInt(req.params.roteiroId);

        const dias = listarDiasDoRoteiro(roteiroId);

        res.json(dias);
    }

    catch (error) {
        res.status( 404).send(error.message);
    }
});

app.post("/dias/:diaId/itens", (req, res) => {
    try {
        const diaId = parseInt(req.params.diaId);
        const { titulo, descricao, localNome } = req.body;

        const item = criarItem(diaId, titulo, descricao, localNome);

        res.status(201).json(item);
    } catch (error) {
        res.status(400).send(error.message);
    }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

