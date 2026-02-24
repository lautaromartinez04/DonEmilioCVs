from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from config.database import Base

class Puesto(Base):
    __tablename__ = "puestos"
    __table_args__ = (
        UniqueConstraint("nombre", "unidad_id", name="uq_puesto_nombre_unidad"),
        Index("ix_puestos_unidad_nombre", "unidad_id", "nombre"),
    )

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(80), nullable=False)
    descripcion = Column(String(255), nullable=True)
    activo = Column(Boolean, nullable=False, default=True)

    unidad_id = Column(
        Integer,
        ForeignKey("unidades_negocio.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    unidad = relationship("UnidadNegocio", back_populates="puestos")
