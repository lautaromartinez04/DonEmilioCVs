export const MOCK_DATA = {
    user: {
        id: 1,
        username: "admin_demo",
        nombre_completo: "Administrador Demo",
        rol: "admin",
        activo: true
    },
    counts: {
        total: 15,
        pendientes: 5,
        preseleccionados: 3,
        entrevistas: 2,
        finalistas: 1,
        rechazados: 4
    },
    unidades: [
        { id: 1, nombre: "Sucursal Central", ciudad: "Córdoba", direccion: "Av. General Paz 120" },
        { id: 2, nombre: "Depósito Logístico", ciudad: "Villa María", direccion: "Ruta 9 km 550" },
        { id: 3, nombre: "Sucursal Norte", ciudad: "Jesús María", direccion: "San Martín 450" }
    ],
    puestos: [
        { id: 101, titulo: "Cajero/a", descripcion: "Atención al cliente y manejo de caja.", unidad_id: 1, activo: true },
        { id: 102, titulo: "Repositor/a", descripcion: "Reposición de mercadería en góndolas.", unidad_id: 1, activo: true },
        { id: 103, titulo: "Analista de Logística", descripcion: "Control de stock y despachos.", unidad_id: 2, activo: true },
        { id: 104, titulo: "Gerente de Sucursal", descripcion: "Gestión integral de la sucursal.", unidad_id: 3, activo: true }
    ],
    postulaciones: [
        {
            id: 1001,
            candidato: { nombre: "Juan Pérez", email: "juan.perez@email.com", telefono: "351-1234567", ciudad: "Córdoba" },
            puesto: { id: 101, titulo: "Cajero/a" },
            unidad: { id: 1, nombre: "Sucursal Central" },
            estado: "pendiente",
            fecha_postulacion: "2024-01-15T10:30:00",
            score_cv: 85,
            comentarios: "Buen perfil, experiencia previa en supermercados."
        },
        {
            id: 1002,
            candidato: { nombre: "María González", email: "maria.gonzalez@email.com", telefono: "351-7654321", ciudad: "Córdoba" },
            puesto: { id: 102, titulo: "Repositor/a" },
            unidad: { id: 1, nombre: "Sucursal Central" },
            estado: "preseleccionado",
            fecha_postulacion: "2024-01-14T09:15:00",
            score_cv: 92,
            comentarios: "Excelente disponibilidad horaria."
        },
        {
            id: 1003,
            candidato: { nombre: "Carlos López", email: "carlos.lopez@email.com", telefono: "353-1122334", ciudad: "Villa María" },
            puesto: { id: 103, titulo: "Analista de Logística" },
            unidad: { id: 2, nombre: "Depósito Logístico" },
            estado: "entrevista",
            fecha_postulacion: "2024-01-10T14:20:00",
            score_cv: 78,
            comentarios: "Estudiante de ingeniería industrial."
        },
        {
            id: 1004,
            candidato: { nombre: "Ana Rodríguez", email: "ana.rod@email.com", telefono: "351-9988776", ciudad: "Jesús María" },
            puesto: { id: 104, titulo: "Gerente de Sucursal" },
            unidad: { id: 3, nombre: "Sucursal Norte" },
            estado: "rechazado",
            fecha_postulacion: "2024-01-05T11:00:00",
            score_cv: 60,
            comentarios: "No cumple con los requisitos de experiencia mínima."
        },
        {
            id: 1005,
            candidato: { nombre: "Luis Martínez", email: "luis.m@email.com", telefono: "351-5556666", ciudad: "Córdoba" },
            puesto: { id: 101, titulo: "Cajero/a" },
            unidad: { id: 1, nombre: "Sucursal Central" },
            estado: "pendiente",
            fecha_postulacion: "2024-01-16T16:45:00",
            score_cv: 70,
            comentarios: ""
        }
    ]
};
