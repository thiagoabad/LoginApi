const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');
const allowlistRefreshToken = require('../../redis/allowlist-refresh-token');
const blocklistAccessToken = require('../../redis/blocklist-access-token');
const { InvalidArgumentError } = require('../erros');

function criaTokenJWT(id, [tempoQuantidade, tempoUnidade]) {
  const payload = { id };
  const token = jwt.sign(payload, process.env.CHAVE_JWT, { expiresIn: tempoQuantidade+tempoUnidade });
  return token;
}

async function criaTokenOpaco(id, [tempoQuantidade, tempoUnidade], allowlist) {
  const tokenOpaco = crypto.randomBytes(24).toString('hex');
  const dataExpiracao = moment().add(tempoQuantidade, tempoUnidade).unix();
  await allowlist.adiciona(tokenOpaco, id, dataExpiracao);
  return tokenOpaco;
}

async function verificaTokenJWT(token, blocklist) {
    await verificaTokenNaBlocklist(token, blocklist);
    const {id} = jwt.verify(token, process.env.CHAVE_JWT);
    return id;
}

async function verificaTokenNaBlocklist(token, nome, blocklist) {
    if (!blocklist) {
        return;
    }
    
    const tokenNaBlocklist = await blocklist.contemToken(token);
    if (tokenNaBlocklist) {
      throw new jwt.JsonWebTokenError(`${nome} inválido por logout!`);
    }
}

async function verificaTokenOpaco(token, nome, allowlist) {
    verificaTokenEnviado(token, nome);
    const id = await allowlist.buscaValor(token);
    verificaTokenValido(id, nome);
    return id;
}

function verificaTokenValido(id, nome) {
    if (!id) {
        throw new InvalidArgumentError(`${nome} token inválido!`);
    }
}

function verificaTokenEnviado(token, nome) {
    if (!token) {
        throw new InvalidArgumentError(`${nome} não enviado!`);
    }
}

async function invalidaTokenJWT(token, blocklist) {
    await blocklist.adiciona(token);
}

async function invalidaTokenOpaco(token, allowlist) {
    await allowlist.deleta(token);
}

module.exports = {
    access: {
        nome: 'Access token',
        expiracao: [15, 'm'],
        lista: blocklistAccessToken, 
        cria(id) {
            return criaTokenJWT(id, this.expiracao);
        },
        verifica(token) {
            return verificaTokenJWT(token, nome, this.lista);
        },
        invalida(token) {
            return invalidaTokenJWT(token, this.lista);
        }
    },
    refresh: {
        nome: 'Refresh token',
        lista: allowlistRefreshToken,
        expiracao: [5, 'd'],
        cria(id) {
            return criaTokenOpaco(id, this.expiracao, this.lista);
        },
        verifica(token) {
            return verificaTokenOpaco(token, this.nome, this.lista);
        },
        invalida(token) {
            return invalidaTokenOpaco(token, this.lista);
        }
    },
    verificacaoEmail: {
        nome: 'Token de verificação de e-mail',
        expiracao: [1, 'h'],
        cria(id) {
            return criaTokenJWT(id, this.expiracao);
        },
        verifica(token) {
            return verificaTokenJWT(token, nome);
        }
    }
}


