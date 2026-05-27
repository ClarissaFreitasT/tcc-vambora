const users = [];

function verificarUsuario(email) {
    const userExists = users.find(user => user.email === email);
    if (userExists) {
        throw new Error("Usuário já registrado.");
    }

}


function cadastrarUsuario(nome, email, senha) {
    if (!nome || !email || !senha) {
        throw new Error("Todos os campos são obrigatórios.");
    }
    verificarUsuario(email);

    const newUser = { id: users.length + 1, nome, email, senha };
    users.push(newUser);
    return newUser;
}

function autenticarUsuario(email, senha) {
    if (!email || !senha) {
        throw new Error("Email e senha são obrigatórios.");
    }
    const user = users.find(user => user.email === email && user.senha === senha);
    if (!user) {
        throw new Error("Credenciais inválidas.");
    }
    return user;
}

module.exports = {
    cadastrarUsuario,
    autenticarUsuario
};

