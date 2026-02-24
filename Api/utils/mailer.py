# utils/mailer.py
import os, ssl, smtplib
from typing import Iterable, Optional
from email.message import EmailMessage
from email.utils import formataddr
from dotenv import load_dotenv

load_dotenv()

MAIL_ENABLED    = os.getenv("MAIL_ENABLED", "true").lower() == "true"
SMTP_HOST       = os.getenv("SMTP_HOST", "smtp.office365.com")
SMTP_PORT       = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME   = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD   = os.getenv("SMTP_PASSWORD", "")
SMTP_SECURITY   = os.getenv("SMTP_SECURITY", "starttls").lower().strip()  # "starttls" | "ssl"

MAIL_FROM_NAME  = os.getenv("MAIL_FROM_NAME", "Notificaciones")
MAIL_FROM_EMAIL = os.getenv("MAIL_FROM_EMAIL", SMTP_USERNAME or "no-reply@example.com")
MAIL_REPLY_TO   = os.getenv("MAIL_REPLY_TO", MAIL_FROM_EMAIL)

def _tls_context() -> ssl.SSLContext:
    # TLS cliente con bundle de CA actualizado (certifi) y TLS1.2+
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    try:
        import certifi
        ctx.load_verify_locations(certifi.where())
    except Exception:
        # fallback al store del sistema si certifi no está
        ctx = ssl.create_default_context()
        ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    return ctx

def _build_message(subject: str, to: Iterable[str], html: str, text: Optional[str] = None) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((MAIL_FROM_NAME, MAIL_FROM_EMAIL))
    to_list = [t.strip() for t in to if t and t.strip()]
    msg["To"] = ", ".join(to_list)
    if MAIL_REPLY_TO:
        msg["Reply-To"] = MAIL_REPLY_TO
    msg.set_content(text or "Ver este correo en HTML.")
    msg.add_alternative(html, subtype="html")
    return msg

def _send_starttls(msg: EmailMessage):
    ctx = _tls_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=60) as s:
        # s.set_debuglevel(1)  # <- descomentar para ver diálogo SMTP
        s.ehlo()
        s.starttls(context=ctx)
        s.ehlo()
        s.login(SMTP_USERNAME, SMTP_PASSWORD)
        s.send_message(msg)

def _send_ssl(msg: EmailMessage):
    ctx = _tls_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ctx, timeout=60) as s:
        # s.set_debuglevel(1)  # <- descomentar para ver diálogo SMTP
        s.login(SMTP_USERNAME, SMTP_PASSWORD)
        s.send_message(msg)

def send_mail(subject: str, to: Iterable[str], html: str, text: Optional[str] = None) -> None:
    if not MAIL_ENABLED:
        print(f"[MAIL_DISABLED] {subject} -> {', '.join(to)}")
        return
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("[MAIL_ERROR] SMTP_USERNAME/SMTP_PASSWORD no configurados")
        return

    msg = _build_message(subject, to, html, text)

    try:
        if SMTP_SECURITY == "ssl":
            _send_ssl(msg)
        else:
            _send_starttls(msg)
        return
    except smtplib.SMTPException as e:
        err = str(e).lower()
        # Fallback cruzado si hay error típico de modo/tls
        try:
            if SMTP_SECURITY == "ssl":
                _send_starttls(msg)
            else:
                _send_ssl(msg)
            print("[MAIL_INFO] Enviado usando fallback de seguridad")
            return
        except Exception as e2:
            print(f"[MAIL_ERROR_FALLBACK] {e2}")
        print(f"[MAIL_ERROR] {e}")
    except Exception as e:
        print(f"[MAIL_ERROR] {e}")
