export function templateRedefinirSenha(nome, link) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #2e7d32; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Sylven</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #333; margin-top: 0;">Redefinição de senha</h2>
      <p style="color: #555; line-height: 1.6;">Olá <strong>${nome}</strong>,</p>
      <p style="color: #555; line-height: 1.6;">
        Recebemos uma solicitação para redefinir sua senha no <strong>Sylven</strong>.
        Clique no botão abaixo para criar uma nova senha:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${link}" style="background: #2e7d32; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; display: inline-block;">
          Redefinir senha
        </a>
      </div>
      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        Este link expira em <strong>15 minutos</strong>.
        Se você não solicitou esta alteração, ignore este email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        Sylven — Gestão ambiental que floresce
      </p>
    </div>
  </div>
</body>
</html>`
}
