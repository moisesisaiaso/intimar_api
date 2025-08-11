const { Resend } = require("resend")

const config = require("../../config/email.config.js")

const resend = new Resend(config.apiKey);

exports.sendCredentialsEmail = async (email, password) =>{
    try{
        console.log("Enviando credenciales");

        const data = await resend.emails.send({
            from: `Intimar <${config.resendEmail}>`,
            to: ['jackopro88@gmail.com'],
            subject: 'Credenciales de inicio de sesión - Intimar',
            html: `<strong>Bienvenido!</strong> <br> 
                    <p>Tus credenciales de inicio de sesión son:</p>
                    <p>Email: ${email}</p>
                    <p>Contraseña: ${password}</p>`,
          });
        console.log(data);
    }catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}