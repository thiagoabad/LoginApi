const nodemailer = require('nodemailer');

const configuracaoEmailProducao = {
    host: process.env.EMAIL_HOST,
    auth: {
        user: process.env.EMAIL_USUARIO,
        pass: process.env.EMAIL_SENHA,
    },
    secure: true,
};
const configuracaoEmailTeste = (contaTeste) => ({
    host: 'smtp.etheral.email',
    auth: contaTeste,
});

async function criaConfiguracaoEmail() {
    if (process.env.NODE_ENV === 'production') {
        return configuracaoEmailProducao;
    } else {
        const contaTeste = await nodemailer.createTestAccount();
        return configuracaoEmailTeste(contaTeste);
    }
}

class Email {
    async enviaEmail() {
        const configuracaoEmail = await criaConfiguracaoEmail();
        const info = await transportador.sendMail(configuracaoEmail);

        if (process.env.NODE_ENV !== 'production') {
            console.log('Url: ', nodemailer.getTestMessageUrl(info));
        }
    }
}

class EmailVerificacao extends Email {
    constructor(usuario, endereco){
        super();
        this.from = '"Blog do código" <noreply@blogdocodigo.com.br>';
        this.to = usuario.email;
        this.subject = "Verificação de e-mail";
        this.text = `Olá! Verifique seu email aqui: ${endereco}`;
        this.html = `<h1>Olá!</h1> Verifique seu email aqui: <a href=${endereco}>${endereco}</a>`;
    }
}

module.exports = {EmailVerificacao}