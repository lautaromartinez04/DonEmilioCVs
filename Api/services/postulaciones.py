from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from typing import Optional
from datetime import datetime, timezone, date

from models.postulaciones import Postulacion
from schemas.postulaciones import PostulacionUpdate


class PostulacionesService:
    def __init__(self, db: Session):
        self.db = db

    # === LISTADO GENERAL CON FILTROS Y PAGINADO ===
    def list(self, q: Optional[str], estado: Optional[str], puesto_id: Optional[int],
             unidad_id: Optional[int], limit: int, offset: int, sort: str = "reciente"):
        from models.puestos import Puesto
        from sqlalchemy import asc, desc, func as sa_func, or_
        
        query = self.db.query(Postulacion)

        if q:
            like = f"%{q}%"
            query = query.filter(
                (Postulacion.nombre.ilike(like)) |
                (Postulacion.apellido.ilike(like)) |
                (Postulacion.correo.ilike(like))
            )

        if estado:
            query = query.filter(Postulacion.estado == estado)

        if unidad_id:
            query = query.filter(or_(Postulacion.unidad_id == unidad_id, Postulacion.unidad_original_id == unidad_id))
            
            if puesto_id:
                # Buscar si existe el puesto "Disponibilidad General" en esta unidad
                puesto_general = self.db.query(Puesto).filter(
                    Puesto.unidad_id == unidad_id,
                    Puesto.nombre.ilike("Disponibilidad General")
                ).first()
                
                if puesto_general and puesto_general.id != puesto_id:
                    # Incluir postulaciones del puesto seleccionado O "Disponibilidad General"
                    query = query.filter(
                        or_(
                            Postulacion.puesto_id.in_([puesto_id, puesto_general.id]),
                            Postulacion.puesto_original_id.in_([puesto_id, puesto_general.id])
                        )
                    )
                else:
                    query = query.filter(
                        or_(Postulacion.puesto_id == puesto_id, Postulacion.puesto_original_id == puesto_id)
                    )
        elif puesto_id:
            query = query.filter(
                or_(Postulacion.puesto_id == puesto_id, Postulacion.puesto_original_id == puesto_id)
            )

        # Ordenamiento
        _sort_map = {
            "reciente":  desc(Postulacion.created_at),
            "antiguo":   asc(Postulacion.created_at),
            "nombre_az": asc(sa_func.lower(Postulacion.nombre)),
            "nombre_za": desc(sa_func.lower(Postulacion.nombre)),
            "procesado": desc(Postulacion.decidido_en),   # los últimos procesados primero
        }
        order_clause = _sort_map.get(sort, desc(Postulacion.created_at))

        total = query.count()
        items = (
            query.order_by(order_clause)
                 .offset(offset)
                 .limit(limit)
                 .all()
        )
        return items, total

    # === OBTENER UNA POSTULACIÓN POR ID ===
    def get(self, id: int) -> Optional[Postulacion]:
        return self.db.query(Postulacion).filter(Postulacion.id == id).first()

    # === CREAR UNA NUEVA POSTULACIÓN DESDE UPLOAD ===
    def create_from_upload(self, *, nombre, apellido, correo, telefono,
                           puesto_id, unidad_id, nota, cv_filename, cv_original,
                           cv_mime, cv_size,
                           # --- nuevos opcionales ---
                           dni: Optional[str] = None,
                           fecha_nacimiento: Optional[date] = None,
                           estado_civil: Optional[str] = None,
                           hijos: Optional[bool] = None,
                           domicilio_residencia: Optional[str] = None,
                           localidad: Optional[str] = None) -> Postulacion:
        obj = Postulacion(
            nombre=nombre, apellido=apellido, correo=correo, telefono=telefono,
            puesto_id=puesto_id, unidad_id=unidad_id, estado="nueva", nota=nota,
            # nuevos campos originales
            puesto_original_id=puesto_id, unidad_original_id=unidad_id,
            cv_filename=cv_filename, cv_original=cv_original,
            cv_mime=cv_mime, cv_size=cv_size,
            # nuevos
            dni=dni,
            fecha_nacimiento=fecha_nacimiento,
            estado_civil=(estado_civil.strip() if isinstance(estado_civil, str) else estado_civil),
            hijos=hijos,
            domicilio_residencia=domicilio_residencia,
            localidad=localidad,
        )
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    # === DECIDIR / CAMBIAR ESTADO ===
    def decide(self, id: int, *, new_estado: str, motivo: str, reviewer_user_id: int, new_unidad_id: Optional[int] = None, new_puesto_id: Optional[int] = None) -> Postulacion:
        obj = self.get(id)
        if not obj:
            raise ValueError("No encontrado")

        new_estado = (new_estado or "").strip()
        if not new_estado:
            raise ValueError("Estado no puede estar vacío")
        if len(new_estado) > 32:
            raise ValueError("Estado demasiado largo (máx. 32)")

        motivo = (motivo or "").strip()
        if not motivo:
            raise ValueError("Motivo obligatorio")

        obj.estado = new_estado
        obj.decidido_motivo = motivo
        obj.decidido_por_user_id = reviewer_user_id
        obj.decidido_en = datetime.now(timezone.utc)
        
        # Actualizar unidad y puesto si se envían
        if new_unidad_id is not None:
            obj.unidad_id = new_unidad_id
        if new_puesto_id is not None:
            obj.puesto_id = new_puesto_id

        self.db.commit()
        self.db.refresh(obj)
        return obj

    # === ACTUALIZAR POSTULACIÓN ===
    def update(self, id: int, data: PostulacionUpdate) -> Optional[Postulacion]:
        obj = self.get(id)
        if not obj:
            return None

        payload = data.model_dump(exclude_unset=True)
        payload.pop("estado", None)  # 'estado' solo se cambia con decide()
        payload.pop("unidad_original_id", None)  # nunca sobreescribir orig
        payload.pop("puesto_original_id", None)  # nunca sobreescribir orig

        for k, v in payload.items():
            setattr(obj, k, v)

        self.db.commit()
        self.db.refresh(obj)
        return obj

    # === ELIMINAR POSTULACIÓN ===
    def delete(self, id: int) -> bool:
        obj = self.get(id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True

    # === RESUMEN GENERAL POR ESTADO ===
    def resumen_por_estado(self) -> dict[str, int]:
        rows = (
            self.db.query(Postulacion.estado, sa_func.count(Postulacion.id))
                   .group_by(Postulacion.estado)
                   .all()
        )
        out = { (estado or ""): int(cnt) for estado, cnt in rows }
        out["total"] = self.db.query(Postulacion).count()
        return out

    # === NUEVOS MÉTODOS ===

    # 1️⃣ Cantidad de nuevas
    def count_nuevas(self) -> int:
        return self.db.query(sa_func.count(Postulacion.id))\
                      .filter(Postulacion.estado == "nueva")\
                      .scalar() or 0

    # 2️⃣ Listar por estado (reutilizable)
    def list_by_estado(self, estado: str, limit: Optional[int] = None, offset: int = 0):
        query = (
            self.db.query(Postulacion)
                   .filter(Postulacion.estado == estado)
                   .order_by(Postulacion.created_at.desc())
        )
        if offset:
            query = query.offset(offset)
        if limit:
            query = query.limit(limit)
        return query.all()

    # 3️⃣ Helpers directos (solo por conveniencia)
    def list_nuevas(self, limit: Optional[int] = None, offset: int = 0):
        return self.list_by_estado("nueva", limit, offset)

    def list_destacadas(self, limit: Optional[int] = None, offset: int = 0):
        return self.list_by_estado("destacada", limit, offset)

    def list_posibles(self, limit: Optional[int] = None, offset: int = 0):
        return self.list_by_estado("posible", limit, offset)

    def list_descartadas(self, limit: Optional[int] = None, offset: int = 0):
        return self.list_by_estado("descartada", limit, offset)
