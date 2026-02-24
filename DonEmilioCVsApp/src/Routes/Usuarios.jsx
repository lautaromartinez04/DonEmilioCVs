import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { UsuariosAPI } from "../api/usuarios";
import UserCreateModal from "../components/users/UserCreateModal";
import UserEditModal from "../components/users/UserEditModal";

const toast = Swal.mixin({
    toast: true,
    position: "bottom",
    timer: 2500,
    showConfirmButton: false,
    timerProgressBar: true,
});

export default function Usuarios() {
    const [data, setData] = useState([]);
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editUser, setEditUser] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await UsuariosAPI.list();
            setData(Array.isArray(res) ? res : res?.items || []);
        } catch (err) {
            toast.fire({ icon: "error", title: err.message || "No se pudo cargar usuarios" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return data;
        return data.filter((u) =>
            [u.nombre, u.apellido, u.correo, String(u.id)]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(term))
        );
    }, [q, data]);

    const onDelete = async (u) => {
        const res = await Swal.fire({
            title: "Eliminar usuario",
            html: `¿Seguro que querés eliminar a <b>${u.nombre} ${u.apellido}</b>?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#dc3545",
        });
        if (!res.isConfirmed) return;

        try {
            await UsuariosAPI.remove(u.id);
            toast.fire({ icon: "success", title: "Usuario eliminado" });
            setData((arr) => arr.filter((x) => x.id !== u.id));
        } catch (err) {
            toast.fire({ icon: "error", title: err.message || "No se pudo eliminar" });
        }
    };

    const onCreated = (u) => {
        // si tu API no devuelve el objeto completo, podemos volver a cargar; por ahora optimista
        setData((arr) => [u, ...arr]);
    };

    const onUpdated = (u) => {
        // si el backend devuelve el usuario actualizado, reemplazamos por id
        setData((arr) => arr.map((x) => (x.id === u.id ? { ...x, ...u } : x)));
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div></div>
                <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold rounded-xl hover:from-brand-500 hover:to-brand-400 transition-all shadow-lg hover:shadow-brand-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-brand-500" onClick={() => setShowCreate(true)}>
                    <i className="fa-solid fa-user-plus mr-2" />
                    Nuevo usuario
                </button>
            </div>

            <div className="bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-3xl border border-white/5 p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="col-span-1 border-0">
                        <div className="relative">
                            <input
                                className="w-full pl-11 pr-4 py-3 bg-gray-800/50 hover:bg-gray-800 border border-white/10 rounded-xl focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder-gray-500 text-gray-100 shadow-inner"
                                placeholder="Buscar por nombre, correo o ID…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-gray-400 flex flex-col justify-center items-center bg-gray-800/30 rounded-2xl border border-white/5 shadow-inner">
                        <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-brand-500"></i>
                        <span className="font-medium tracking-wide">Cargando usuarios…</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 bg-gray-800/30 rounded-2xl border border-white/5 shadow-inner flex flex-col items-center">
                        <i className="fa-regular fa-user text-5xl mb-4 text-gray-600 drop-shadow-md"></i>
                        <p className="font-medium text-lg text-gray-300">Sin resultados</p>
                        <p className="text-sm mt-1">No se encontraron usuarios con ese criterio.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10 shadow-inner bg-gray-800/50">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="px-5 py-4 bg-gray-800/80 border-b border-white/10 font-bold text-gray-300 uppercase tracking-wider text-xs">ID</th>
                                    <th className="px-5 py-4 bg-gray-800/80 border-b border-white/10 font-bold text-gray-300 uppercase tracking-wider text-xs">Nombre</th>
                                    <th className="px-5 py-4 bg-gray-800/80 border-b border-white/10 font-bold text-gray-300 uppercase tracking-wider text-xs">Apellido</th>
                                    <th className="px-5 py-4 bg-gray-800/80 border-b border-white/10 font-bold text-gray-300 uppercase tracking-wider text-xs">Correo</th>
                                    <th className="px-5 py-4 bg-gray-800/80 border-b border-white/10 font-bold text-gray-300 uppercase tracking-wider text-xs w-32">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-800/80 transition-colors border-b border-white/5 last:border-0 group">
                                        <td className="px-5 py-4 align-middle text-gray-400 font-bold">#{u.id}</td>
                                        <td className="px-5 py-4 align-middle font-bold text-gray-100">{u.nombre}</td>
                                        <td className="px-5 py-4 align-middle font-bold text-gray-100">{u.apellido}</td>
                                        <td className="px-5 py-4 align-middle text-brand-300/80 font-medium tracking-wide">
                                            <i className="fa-regular fa-envelope mr-2 opacity-50" />{u.correo}
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <div className="flex gap-2">
                                                <button
                                                    className="p-2 bg-gray-800 border border-white/5 rounded-xl text-gray-400 hover:text-brand-400 hover:border-brand-500/30 hover:bg-brand-500/10 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                                                    onClick={() => setEditUser(u)}
                                                    title="Editar">
                                                    <i className="fa-regular fa-pen-to-square text-lg" />
                                                </button>
                                                <button
                                                    className="p-2 bg-gray-800 border border-white/5 rounded-xl text-gray-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500/40"
                                                    onClick={() => onDelete(u)}
                                                    title="Eliminar"
                                                >
                                                    <i className="fa-regular fa-trash-can text-lg" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de creación */}
            <UserCreateModal
                show={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={onCreated}
            />
            <UserEditModal
                show={!!editUser}
                user={editUser}
                onClose={() => setEditUser(null)}
                onUpdated={onUpdated}
            />
        </div>
    );
}
