from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from config.database import Base

class UnidadNegocio(Base):
    __tablename__ = "unidades_negocio"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(80), unique=True, nullable=False, index=True)
    descripcion = Column(String(255), nullable=True)
    activo = Column(Boolean, nullable=False, default=True)

    # Relación 1-N con Puesto
    puestos = relationship(
        "Puesto",
        back_populates="unidad",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
