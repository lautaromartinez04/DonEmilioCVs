# utils/email_templates.py
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from html import escape
from dotenv import load_dotenv

load_dotenv()

TIMEZONE = os.getenv("TIMEZONE", "UTC")
ADMIN_DASHBOARD_URL = os.getenv("ADMIN_DASHBOARD_URL", "").rstrip("/")

def _fmt_dt(dt: datetime) -> str:
    try:
        tz = ZoneInfo(TIMEZONE)
        dt = dt.astimezone(tz)
    except Exception:
        dt = dt.astimezone(timezone.utc)
    return dt.strftime("%d/%m/%Y %H:%M:%S")

def candidate_confirmation(nombre: str, apellido: str, created_at: datetime):
    full = f"{nombre} {apellido}".strip()
    when = _fmt_dt(created_at)
    subj = "Confirmación de envío de CV"
    html = f"""
    <div style="font-family:system-ui,Arial,sans-serif;line-height:1.5">
      <h2>¡Gracias, {escape(full)}!</h2>
      <p>Recibimos tu CV correctamente el <b>{escape(when)}</b>.</p>
      <p>Nuestro equipo de RRHH revisará tu postulación y se pondrá en contacto si avanzamos con el proceso.</p>
      <p style="color:#666;font-size:12px">Este es un mensaje automático, por favor no responder.</p>
    </div>
    """
    text = f"Gracias, {full}! Recibimos tu CV el {when}."
    return subj, html, text

def admin_new_cv(aviso_id: int, nombre: str, apellido: str, correo: str, telefono: str | None,
                 unidad: str | None, puesto: str | None, created_at: datetime):
    full = f"{nombre} {apellido}".strip()
    when = _fmt_dt(created_at)
    subj = f"[RRHH] Nuevo CV #{aviso_id} - {full}"
    dash_link = f"{ADMIN_DASHBOARD_URL}/postulaciones/{aviso_id}" if ADMIN_DASHBOARD_URL else None
    unidad_txt = unidad or "—"
    puesto_txt = puesto or "—"
    tel_txt = telefono or "—"

    link_html = f'<p><a href="{dash_link}" style="color:#5170FF">Abrir en panel</a></p>' if dash_link else ""

    html = f"""
    <div style="font-family:system-ui,Arial,sans-serif;line-height:1.5">
      <h2>Nuevo CV recibido</h2>
      
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 8px;color:#555">ID</td><td><b>{aviso_id}</b></td></tr>
        <tr><td style="padding:4px 8px;color:#555">Fecha</td><td>{escape(when)}</td></tr>
        <tr><td style="padding:4px 8px;color:#555">Nombre</td><td>{escape(full)}</td></tr>
        <tr><td style="padding:4px 8px;color:#555">Correo</td><td>{escape(correo)}</td></tr>
        <tr><td style="padding:4px 8px;color:#555">Teléfono</td><td>{escape(tel_txt)}</td></tr>
        <tr><td style="padding:4px 8px;color:#555">Unidad de negocio</td><td>{escape(unidad_txt)}</td></tr>
        <tr><td style="padding:4px 8px;color:#555">Puesto</td><td>{escape(puesto_txt)}</td></tr>
      </table>

      {link_html}

      <p style="color:#666;font-size:12px">Mensaje automático • RRHH</p>
    </div>
    """
    text = f"Nuevo CV recibido (ID {aviso_id}) - {full} - {correo} - {tel_txt} - Unidad: {unidad_txt} - Puesto: {puesto_txt} - {when}"
    return subj, html, text
