const LAYOUT = (content: string) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #ffffff;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #000000;
        -webkit-font-smoothing: antialiased;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 60px 20px;
      }
      .header {
        margin-bottom: 40px;
        border-bottom: 1px solid #000000;
        padding-bottom: 20px;
      }
      .logo {
        font-size: 24px;
        font-weight: 700;
        letter-spacing: -1px;
        text-transform: uppercase;
      }
      .content {
        line-height: 1.6;
        font-size: 16px;
      }
      .title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 24px;
        letter-spacing: -0.5px;
      }
      .footer {
        margin-top: 60px;
        padding-top: 20px;
        border-top: 1px solid #eeeeee;
        font-size: 12px;
        color: #666666;
        text-align: center;
      }
      .button {
        display: inline-block;
        background-color: #000000;
        color: #ffffff !important;
        padding: 16px 32px;
        text-decoration: none;
        border-radius: 0;
        font-weight: 700;
        margin-top: 30px;
        text-transform: uppercase;
        font-size: 14px;
        letter-spacing: 1px;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        margin: 40px 0;
      }
      .table th {
        text-align: left;
        font-weight: 700;
        border-bottom: 2px solid #000000;
        padding: 12px 0;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 1px;
      }
      .table td {
        padding: 16px 0;
        border-bottom: 1px solid #eeeeee;
      }
      .total-row {
        font-size: 20px;
        font-weight: 700;
        text-align: right;
        padding-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Ecommerce Core</div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Ecommerce Core. All rights reserved.<br/>
        Estás recibiendo este correo por una actividad en tu cuenta.
      </div>
    </div>
  </body>
</html>
`;

export const getOrderConfirmationTemplate = (order: any, userName: string) => {
  const itemsHtml = order.items
    .map(
      (item: any) => `
    <tr>
      <td>${item.product.name} <span style="color: #666">× ${item.quantity}</span></td>
      <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  const content = `
    <h1 class="title">Gracias por tu orden, ${userName}.</h1>
    <p>Hemos recibido tu pedido <strong>#${order.id.slice(0, 8)}</strong> y estamos preparando el envío.</p>
    
    <table class="table">
      <thead>
        <tr>
          <th>Producto</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div class="total-row">
      Total: $${Number(order.total).toFixed(2)}
    </div>
  `;

  return LAYOUT(content);
};

export const getPasswordResetTemplate = (
  resetUrl: string,
  userName: string,
) => {
  const content = `
    <h1 class="title">Restablece tu contraseña.</h1>
    <p>Hola ${userName}, recibimos una solicitud para cambiar tu contraseña de Ecommerce Core.</p>
    <p>Si solicitaste este cambio, puedes continuar haciendo clic en el botón de abajo:</p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
    </div>
    
    <p style="margin-top: 40px; font-size: 13px; color: #666;">
      Si no solicitaste este cambio, ignora este correo. Este enlace expirará en 1 hora.
    </p>
  `;

  return LAYOUT(content);
};
