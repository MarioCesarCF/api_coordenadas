import sgMail from "@sendgrid/mail";

export function configurarEmail() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
  }
}

export async function enviarEmail({ para, assunto, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !from) {
    console.log("[EMAIL DEV] Para:", para);
    console.log("[EMAIL DEV] Assunto:", assunto);
    console.log("[EMAIL DEV] Corpo:\n", html);
    return { enviado: false, dev: true };
  }

  try {
    await sgMail.send({ to: para, from, subject: assunto, html });
    return { enviado: true };
  } catch (err) {
    console.error("Erro ao enviar email:", err.response?.body || err.message);
    throw err;
  }
}
