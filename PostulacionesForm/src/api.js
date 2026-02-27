export const API_BASE = import.meta.env.VITE_API_URL || "http://192.168.0.25:8000";

export async function fetchUnidadesNegocio() {
  const url = `${API_BASE}/unidades-negocio?include_inactive=false`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-Key": "Donemilio@2026"
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error HTTP ${res.status}`);
  }
  /** Esperado:
   * [
   *   {
   *     "nombre": "Don Emilio",
   *     "descripcion": "Don Emilio",
   *     "activo": true,
   *     "id": 1,
   *     "puestos": [
   *       {"nombre":"Cajero","descripcion":"Cajero","activo":true,"id":1,"unidad_id":1}
   *     ]
   *   }
   * ]
   */
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
