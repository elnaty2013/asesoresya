const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'hola@asesoresya.com';
const URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── HELPER: enviar email ──
async function send(to, subject, html) {
  try {
    const { data, error } = await resend.emails.send({
      from: `AsesoresYa <${FROM}>`,
      to,
      subject,
      html
    });
    if (error) throw error;
    console.log(`📧 Email enviado a ${to}: ${subject}`);
    return { ok: true };
  } catch (err) {
    console.error('❌ Error enviando email:', err);
    return { ok: false, error: err };
  }
}

// ── HEADER Y FOOTER COMUNES ──
const header = (subtitulo = '') => `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f0f0f0;font-family:'DM Sans',Arial,sans-serif}
  .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 4px 20px rgba(0,0,0,.1)}
  .header{background:linear-gradient(135deg,#0a0a0f,#13131a);padding:32px 40px;text-align:center}
  .logo{font-size:28px;font-weight:900;color:#f0c040;letter-spacing:3px;font-family:Arial,sans-serif}
  .logo span{color:#f0efe8}
  .sub{font-size:11px;color:rgba(255,255,255,.3);letter-spacing:2px;margin-top:4px;font-family:'Courier New',monospace}
  .body{padding:36px 40px}
  .footer{background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e8eaed}
  .footer p{font-size:12px;color:#999;line-height:1.8;margin:0}
  .footer a{color:#f0c040;text-decoration:none}
  .btn{display:inline-block;padding:16px 32px;border-radius:100px;font-weight:700;font-size:15px;text-decoration:none;margin:8px 0}
  .btn-y{background:#f0c040;color:#0a0a0f}
  .btn-g{background:#3de0a0;color:#0a0a0f}
  .btn-b{background:#009ee3;color:#fff}
  .card{background:#f8f9fa;border:1px solid #e8eaed;border-radius:12px;padding:20px;margin:16px 0}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e8eaed;font-size:14px}
  .row:last-child{border:none}
  .key{color:#666}.val{font-weight:600;color:#202124;font-family:'Courier New',monospace}
  .val.g{color:#1a9e5e}.val.y{color:#d4940a}
  .zoom-box{background:linear-gradient(135deg,#0a2a1a,#0d1f15);border-radius:12px;padding:20px;text-align:center;margin:16px 0}
  .zoom-lbl{font-size:10px;color:#3de0a0;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;font-family:'Courier New',monospace}
  .zoom-link{color:#f0efe8;font-family:'Courier New',monospace;font-size:13px;word-break:break-all}
  .zoom-id{color:#f0c040;font-size:22px;font-weight:900;letter-spacing:3px;margin-top:6px}
  .alert{border-radius:10px;padding:14px 16px;margin:14px 0;font-size:13px;line-height:1.7}
  .alert-y{background:#fff8e1;border-left:3px solid #f0c040;color:#7a5c00}
  .alert-g{background:#e8fdf5;border-left:3px solid #3de0a0;color:#1a5c3a}
  .alert-r{background:#fff0f0;border-left:3px solid #ff5c5c;color:#7a2020}
  h2{font-size:24px;font-weight:700;color:#202124;margin-bottom:8px;line-height:1.3}
  p{font-size:14px;color:#444;line-height:1.8;margin-bottom:14px}
</style></head><body><div class="wrap">
<div class="header">
  <div class="logo">Asesores<span>Ya</span></div>
  <div class="sub">${subtitulo}</div>
</div><div class="body">`;

const footer = () => `
</div>
<div class="footer">
  <p>© 2025 AsesoresYa · Argentina<br>
  <a href="${URL}">Inicio</a> · <a href="${URL}/terminos.html">Términos</a> · <a href="${URL}/faq.html">FAQ</a><br>
  Si tenés alguna consulta escribinos a <a href="mailto:hola@asesoresya.com">hola@asesoresya.com</a></p>
</div></div></body></html>`;

// ════════════════════════════════════════
// EMAILS AL ASESOR
// ════════════════════════════════════════

// 1. Nueva solicitud → Asesor
async function emailNuevaSolicitud(asesor, sesion, cliente) {
  const html = header('// nueva solicitud') + `
    <h2>📥 Tenés una nueva solicitud</h2>
    <p>Un cliente quiere una sesión con vos. Entrá a tu panel para revisar los detalles y proponer un horario.</p>
    <div class="card">
      <div class="row"><span class="key">Cliente</span><span class="val">${cliente.nombre}</span></div>
      <div class="row"><span class="key">Área</span><span class="val">${sesion.tipo}</span></div>
      <div class="row"><span class="key">Modalidad</span><span class="val">${sesion.modalidad === 'videollamada' ? '📹 Videollamada' : '📍 Presencial'}</span></div>
      <div class="row"><span class="key">Tu honorario</span><span class="val y">$${Number(sesion.honorario).toLocaleString('es-AR')}</span></div>
    </div>
    <div class="alert alert-y">
      💬 <strong>Objetivo del cliente:</strong> ${sesion.objetivo}
    </div>
    <p>Tenés hasta <strong>2 semanas</strong> para proponer un horario. Cuanto antes respondas, más chances tenés de confirmar la sesión.</p>
    <div style="text-align:center;margin-top:24px">
      <a class="btn btn-g" href="${URL}/panel-asesor.html">Ver solicitud y proponer horario →</a>
    </div>
    <p style="font-size:12px;color:#999;margin-top:20px;text-align:center">Si no podés atender esta solicitud, rechazala desde el panel para que el cliente pueda elegir otro asesor.</p>
  ` + footer();
  return send(asesor.email, `📥 Nueva solicitud de asesoría — ${cliente.nombre}`, html);
}

// 2. Pago confirmado → Asesor
async function emailPagoAsesor(asesor, sesion, cliente) {
  const html = header('// pago confirmado') + `
    <h2>💰 ¡El cliente pagó! Sesión confirmada</h2>
    <p>El pago fue procesado. Tu sesión con <strong>${cliente.nombre}</strong> está confirmada.</p>
    <div class="card">
      <div class="row"><span class="key">Cliente</span><span class="val">${cliente.nombre}</span></div>
      <div class="row"><span class="key">Email</span><span class="val">${cliente.email}</span></div>
      <div class="row"><span class="key">Fecha</span><span class="val g">${sesion.fecha_propuesta}</span></div>
      <div class="row"><span class="key">Hora</span><span class="val g">${sesion.hora_propuesta} hs</span></div>
      <div class="row"><span class="key">Modalidad</span><span class="val">${sesion.modalidad === 'videollamada' ? '📹 Videollamada' : '📍 Presencial'}</span></div>
      <div class="row"><span class="key">Tu ganancia (70%)</span><span class="val g">$${Math.round(sesion.honorario * 0.70).toLocaleString('es-AR')}</span></div>
    </div>
    <div class="alert alert-g">
      ✅ Recibirás tu pago (70% del honorario) dentro de las 48 hs de realizada la sesión.
    </div>
    <div style="text-align:center;margin-top:24px">
      <a class="btn btn-g" href="${URL}/panel-asesor.html">Ver en mi panel →</a>
    </div>
  ` + footer();
  return send(asesor.email, `💰 Sesión confirmada — ${cliente.nombre} · ${sesion.fecha_propuesta}`, html);
}

// ════════════════════════════════════════
// EMAILS AL CLIENTE
// ════════════════════════════════════════

// 3. Solicitud enviada → Cliente
async function emailSolicitudEnviada(cliente, sesion, asesor) {
  const html = header('// solicitud enviada') + `
    <h2>📥 ¡Tu solicitud fue enviada!</h2>
    <p>Le notificamos a <strong>${asesor.nombre}</strong>. En cuanto proponga un horario te avisamos por email para que puedas confirmar y pagar.</p>
    <div class="card">
      <div class="row"><span class="key">Asesor</span><span class="val">${asesor.nombre}</span></div>
      <div class="row"><span class="key">Área</span><span class="val">${sesion.tipo}</span></div>
      <div class="row"><span class="key">Modalidad</span><span class="val">${sesion.modalidad === 'videollamada' ? '📹 Videollamada' : '📍 Presencial'}</span></div>
    </div>
    <div class="alert alert-y">
      ⏳ El asesor tiene hasta <strong>2 semanas</strong> para proponerte un horario. Revisá tu casilla de Gmail regularmente.
    </div>
    <p style="font-size:12px;color:#999">¿Cambiaste de idea? Podés cancelar la solicitud desde tu panel.</p>
    <div style="text-align:center;margin-top:24px">
      <a class="btn btn-y" href="${URL}/panel-cliente.html">Ver en mi panel →</a>
    </div>
  ` + footer();
  return send(cliente.email, `📥 Solicitud enviada — ${asesor.nombre}`, html);
}

// 4. Propuesta de horario → Cliente
async function emailPropuestaHorario(cliente, sesion, asesor) {
  const comision = Math.round(sesion.honorario * 0.30);
  const total = sesion.honorario + comision;
  const html = header('// propuesta de horario') + `
    <h2>📅 ¡${asesor.nombre} propuso un horario!</h2>
    <p>Revisá los detalles y transferí al alias de Mercado Pago para confirmar tu lugar. Una vez que confirmemos tu pago te enviamos el acceso a la reunión.</p>
    <div class="card">
      <div class="row"><span class="key">Asesor</span><span class="val">${asesor.nombre}</span></div>
      <div class="row"><span class="key">Fecha</span><span class="val g">${sesion.fecha_propuesta}</span></div>
      <div class="row"><span class="key">Hora</span><span class="val g">${sesion.hora_propuesta} hs</span></div>
      <div class="row"><span class="key">Duración</span><span class="val">60 minutos</span></div>
      <div class="row"><span class="key">Modalidad</span><span class="val">${sesion.modalidad === 'videollamada' ? '📹 Videollamada' : '📍 Presencial'}</span></div>
    </div>
    <div class="card">
      <div class="row"><span class="key">Honorario del asesor</span><span class="val">$${Number(sesion.honorario).toLocaleString('es-AR')}</span></div>
      <div class="row"><span class="key">Comisión plataforma (30%)</span><span class="val">$${comision.toLocaleString('es-AR')}</span></div>
      <div class="row" style="font-weight:700"><span class="key" style="font-weight:700;color:#202124">Total a transferir</span><span class="val y" style="font-size:18px">$${total.toLocaleString('es-AR')}</span></div>
    </div>
    <div class="alert alert-g">
      💳 <strong>Cómo pagar:</strong><br>
      Transferí <strong>$${total.toLocaleString('es-AR')}</strong> al alias de Mercado Pago:<br>
      <div style="font-size:22px;font-weight:900;color:#1a9e5e;letter-spacing:3px;margin-top:8px;font-family:'Courier New',monospace">asesoresya</div>
      <div style="font-size:12px;color:#555;margin-top:6px">Aclaración: tu nombre completo · Sesión con ${asesor.nombre}</div>
    </div>
    <div class="alert alert-y">
      ⚠️ Una vez que confirmemos tu transferencia (dentro de las 2 hs hábiles) te enviamos el link de Zoom o la dirección de la reunión.
    </div>
    ${sesion.nota_asesor ? `<div class="alert alert-g">📝 <strong>Nota del asesor:</strong> ${sesion.nota_asesor}</div>` : ''}
    <div style="text-align:center;margin-top:24px">
      <a class="btn btn-y" href="${URL}/panel-cliente.html">Ver en mi panel →</a>
    </div>
  ` + footer();
  return send(cliente.email, `📅 ${asesor.nombre} propuso un horario para tu sesión`, html);
}

// 5. Pago confirmado + Zoom → Cliente
async function emailPagoConfirmado(cliente, sesion, asesor) {
  const esZoom = sesion.modalidad === 'videollamada';
  const html = header('// sesión confirmada') + `
    <h2 style="color:#1a9e5e">✅ ¡Pago confirmado! Sesión reservada.</h2>
    <p>Tu transferencia fue acreditada. A continuación tenés los datos de acceso a tu sesión con <strong>${asesor.nombre}</strong>.</p>
    <div class="card">
      <div class="row"><span class="key">Asesor</span><span class="val">${asesor.nombre}</span></div>
      <div class="row"><span class="key">Fecha</span><span class="val g">${sesion.fecha_propuesta}</span></div>
      <div class="row"><span class="key">Hora</span><span class="val g">${sesion.hora_propuesta} hs</span></div>
      <div class="row"><span class="key">Modalidad</span><span class="val">${esZoom ? '📹 Videollamada' : '📍 Presencial'}</span></div>
      <div class="row"><span class="key">Total pagado</span><span class="val g">$${Number(sesion.total).toLocaleString('es-AR')} ✓</span></div>
    </div>
    ${esZoom ? `
    <div class="zoom-box">
      <div class="zoom-lbl">🎥 Tu link de Zoom</div>
      <div class="zoom-link">${sesion.zoom_link}</div>
      <div class="zoom-id">ID: ${sesion.zoom_id}</div>
    </div>
    ` : `
    <div class="alert alert-g">
      📍 <strong>Dirección de la reunión:</strong><br>${sesion.direccion || asesor.direccion}
    </div>
    `}
    <div class="alert alert-g">
      📌 Agregá la sesión a tu calendario y conectate 5 minutos antes. Te enviamos un recordatorio 1 hora antes de la sesión.
    </div>
    <div style="text-align:center;margin-top:24px">
      <a class="btn btn-g" href="${sesion.zoom_link || URL + '/panel-cliente.html'}">${esZoom ? '📹 Abrir Zoom →' : 'Ver en mi panel →'}</a>
    </div>
    <p style="font-size:12px;color:#999;text-align:center;margin-top:16px">N° referencia: ${sesion.id}</p>
  ` + footer();
  return send(cliente.email, `✅ Sesión confirmada — ${asesor.nombre} · ${sesion.fecha_propuesta}`, html);
}

// 6. Recordatorio 1 hora antes → Cliente
async function emailRecordatorio(cliente, sesion, asesor) {
  const esZoom = sesion.modalidad === 'videollamada';
  const html = header('// recordatorio') + `
    <h2>⏰ Tu sesión empieza en 1 hora</h2>
    <p><strong>${asesor.nombre}</strong> te espera hoy a las <strong>${sesion.hora_propuesta} hs</strong>.</p>
    <div class="card">
      <div class="row"><span class="key">Asesor</span><span class="val">${asesor.nombre}</span></div>
      <div class="row"><span class="key">Hoy a las</span><span class="val y">${sesion.hora_propuesta} hs</span></div>
      <div class="row"><span class="key">Modalidad</span><span class="val">${esZoom ? '📹 Videollamada' : '📍 Presencial'}</span></div>
    </div>
    ${esZoom ? `
    <div class="zoom-box">
      <div class="zoom-lbl">🎥 Tu link</div>
      <div class="zoom-link">${sesion.zoom_link}</div>
    </div>
    ` : `<div class="alert alert-g">📍 ${sesion.direccion || asesor.direccion}</div>`}
    <div style="text-align:center;margin-top:24px">
      <a class="btn btn-y" href="${sesion.zoom_link || URL + '/panel-cliente.html'}">${esZoom ? '📹 Entrar a Zoom →' : 'Ver detalles →'}</a>
    </div>
  ` + footer();
  return send(cliente.email, `⏰ Tu sesión empieza en 1 hora — ${asesor.nombre} a las ${sesion.hora_propuesta}`, html);
}

// 7. Convocatoria entrevista → Postulante
async function emailEntrevista(postulante, datos) {
  const html = header('// convocatoria entrevista') + `
    <h2 style="color:#1a9e5e">🎓 ¡Tu postulación avanzó!</h2>
    <p>El equipo de AsesoresYa quiere conocerte. Programamos una entrevista para evaluar tu postulación.</p>
    <div class="card">
      <div class="row"><span class="key">Postulante</span><span class="val">${postulante.nombre}</span></div>
      <div class="row"><span class="key">Fecha</span><span class="val g">${datos.fecha}</span></div>
      <div class="row"><span class="key">Hora</span><span class="val g">${datos.hora} hs</span></div>
      <div class="row"><span class="key">Modalidad</span><span class="val">${datos.modalidad === 'zoom' ? '📹 Videollamada' : '📍 Presencial'}</span></div>
      <div class="row"><span class="key">Duración</span><span class="val">~30 minutos</span></div>
    </div>
    ${datos.modalidad === 'zoom' ? `
    <div class="zoom-box">
      <div class="zoom-lbl">🎥 Link de la entrevista</div>
      <div class="zoom-link">${datos.zoom}</div>
    </div>` : `<div class="alert alert-g">📍 <strong>Dirección:</strong> ${datos.direccion}</div>`}
    <div class="alert alert-g">
      📌 Traé tu CV y los datos de tu matrícula o título. Conectate 5 minutos antes.
    </div>
    <div style="text-align:center;margin-top:24px">
      <a class="btn btn-g" href="${URL}/faq.html">Ver confirmación completa →</a>
    </div>
    <p style="font-size:12px;color:#999;text-align:center;margin-top:16px">¿Necesitás reprogramar? Escribinos a hola@asesoresya.com con 24 hs de anticipación.</p>
  ` + footer();
  return send(postulante.email, `🎓 Entrevista programada — AsesoresYa te cita el ${datos.fecha}`, html);
}

// 8. Asesor aprobado
async function emailAsesorAprobado(asesor, password) {
  // password viene en texto plano desde la ruta antes de perderse en memoria
  const html = header('// bienvenido a la plataforma') + `
    <h2 style="color:#1a9e5e">🎉 ¡Sos parte de AsesoresYa!</h2>
    <p>Tu postulación fue aprobada. Ya podés empezar a recibir clientes en la plataforma.</p>
    <div class="card">
      <div class="row"><span class="key">Email</span><span class="val">${s(asesor.email)}</span></div>
      <div class="row"><span class="key">Contraseña</span><span class="val y">${s(password)}</span></div>
      <div class="row"><span class="key">Panel</span><span class="val g">${URL}/panel-asesor.html</span></div>
    </div>
    <div class="alert alert-g">
      💡 <strong>Próximos pasos:</strong> Ingresá al panel, completá tu perfil, subí tu foto y configurá tu disponibilidad. Las solicitudes empezarán a llegar automáticamente.
    </div>
    <div class="alert alert-y">
      💰 AsesoresYa cobra el <strong>30% de comisión</strong> por cada sesión. El 70% restante se transfiere dentro de las 48 hs de cada sesión realizada.
    </div>
    <div style="text-align:center;margin-top:24px">
      <a class="btn btn-g" href="${URL}/panel-asesor.html">Entrar a mi panel →</a>
    </div>
  ` + footer();
  return send(asesor.email, `🎉 ¡Felicitaciones! Sos parte de AsesoresYa`, html);
}

// 9. Asesor rechazado
async function emailAsesorRechazado(postulante) {
  const html = header('// resultado postulación') + `
    <h2>Resultado de tu postulación</h2>
    <p>Hola <strong>${postulante.nombre}</strong>, gracias por postularte en AsesoresYa.</p>
    <p>Luego de revisar tu postulación, en esta oportunidad no podemos incorporarte a la plataforma. Esto puede deberse a que el cupo en tu especialidad está completo o que tu perfil no se ajusta a los requisitos actuales.</p>
    <div class="alert alert-y">
      💡 Podés volver a postularte en 6 meses. Si creés que hubo un error, escribinos a hola@asesoresya.com
    </div>
    <p>¡Mucho éxito en tu carrera profesional!</p>
  ` + footer();
  return send(postulante.email, `Resultado de tu postulación — AsesoresYa`, html);
}

module.exports = {
  emailNuevaSolicitud,
  emailPagoAsesor,
  emailSolicitudEnviada,
  emailPropuestaHorario,
  emailPagoConfirmado,
  emailRecordatorio,
  emailEntrevista,
  emailAsesorAprobado,
  emailAsesorRechazado
};
