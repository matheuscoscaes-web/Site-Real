const BRAND = "#955707";

export function passwordResetEmail(name: string, resetUrl: string) {
  return {
    subject: "Redefinir sua senha — Hearts Couro",
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f9f3e8; padding:32px 16px;">
        <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #f0e6d2;">
          <div style="background:${BRAND}; padding:24px 28px;">
            <h1 style="color:#fff; font-size:20px; margin:0;">Hearts Couro</h1>
          </div>
          <div style="padding:28px;">
            <h2 style="color:#1c1c1c; font-size:18px; margin:0 0 12px;">Redefinir sua senha</h2>
            <p style="color:#555; font-size:14px; line-height:1.6;">
              Olá, ${name.split(" ")[0]}! Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora.
            </p>
            <p style="margin-top:24px;">
              <a href="${resetUrl}" style="background:${BRAND}; color:#fff; text-decoration:none; padding:12px 24px; border-radius:999px; font-weight:bold; font-size:14px; display:inline-block;">
                Redefinir minha senha
              </a>
            </p>
            <p style="color:#999; font-size:12px; line-height:1.6; margin-top:24px;">
              Se você não pediu essa redefinição, pode ignorar este e-mail com segurança — sua senha continua a mesma.
            </p>
          </div>
        </div>
      </div>`,
  };
}
