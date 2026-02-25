from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from config.database import Base

class Postulacion(Base):
    __tablename__ = "postulaciones"

    id = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(60), nullable=False)
    apellido = Column(String(60), nullable=False)
    correo = Column(String(120), nullable=False, index=True)
    telefono = Column(String(40), nullable=True)

    puesto_id = Column(Integer, ForeignKey("puestos.id"), nullable=True)
    unidad_id = Column(Integer, ForeignKey("unidades_negocio.id"), nullable=True)

    # --- Campos originales (para mantener historial) ---
    puesto_original_id = Column(Integer, ForeignKey("puestos.id"), nullable=True)
    unidad_original_id = Column(Integer, ForeignKey("unidades_negocio.id"), nullable=True)

    # --------------------------------------------------------
    # Estado ahora es un string libre, sin Enum/Literal.
    # Podés modificarlo libremente desde la API o la DB.
    # --------------------------------------------------------
    estado = Column(String(32), nullable=False, server_default="nueva")

    nota = Column(String(255), nullable=True)

    # Archivo
    cv_filename = Column(String(200), nullable=False)
    cv_original = Column(String(200), nullable=False)
    cv_mime = Column(String(80), nullable=False)
    cv_size = Column(Integer, nullable=False, default=0)

    # --- Nuevos campos del postulante ---
    dni = Column(String(20), nullable=True, index=True)
    fecha_nacimiento = Column(Date, nullable=True)
    estado_civil = Column(String(20), nullable=True)          # str abierto (limitado en front)
    hijos = Column(Boolean, nullable=True)                  # validar >= 0 en front/schema
    domicilio_residencia = Column(String(200), nullable=True)
    localidad = Column(String(120), nullable=True)

    # Auditoría de decisión
    decidido_motivo = Column(String(255), nullable=True)
    decidido_por_user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    decidido_en = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    puesto = relationship("Puesto", foreign_keys=[puesto_id])
    unidad = relationship("UnidadNegocio", foreign_keys=[unidad_id])
    puesto_original = relationship("Puesto", foreign_keys=[puesto_original_id])
    unidad_original = relationship("UnidadNegocio", foreign_keys=[unidad_original_id])
    decidido_por = relationship("Usuarios")  # opcional: usuario revisor
