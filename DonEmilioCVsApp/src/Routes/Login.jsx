// src/Routes/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

const toast = Swal.mixin({
    toast: true,
    position: "bottom",
    timer: 2500,
    showConfirmButton: false,
    timerProgressBar: true,
});

export default function Login() {
    const navigate = useNavigate();
    const { login, remember: rememberCtx, setRemember } = useAuth();
    const [form, setForm] = useState({ email: "", password: "", remember: rememberCtx });

    useEffect(() => {
        setForm(f => ({ ...f, remember: rememberCtx }));
    }, [rememberCtx]);

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === "checkbox" ? checked : value;

        setForm(f => ({ ...f, [name]: val }));
        if (name === "remember") setRemember(val); // sincronizá el contexto inmediatamente
    };



    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.fire({ icon: "warning", title: "Completá email y contraseña" });
            return;
        }
        setLoading(true);
        try {
            await login(form.email, form.password, form.remember);

            // Intento de guardar credenciales (solo en contextos seguros)
            if ('credentials' in navigator && window.PasswordCredential) {
                try {
                    const cred = new window.PasswordCredential({
                        id: form.email,           // usuario
                        password: form.password,  // contraseña
                        name: `${form.email}`,    // opcional (para mostrar)
                        // iconURL: '/favicon.ico' // opcional
                    });
                    await navigator.credentials.store(cred);
                } catch { /* no-op */ }
            }

            navigate("/dashboard", { replace: true });
        } catch (err) {
            const msg = err.status === 401
                ? "Usuario o contraseña incorrectos"
                : "No se pudo iniciar sesión";
            toast.fire({ icon: "error", title: msg, text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white shadow-xl rounded-2xl border border-gray-100">
                    <div className="p-8">
                        <div className="flex justify-center mb-6">
                            {/* Logo placeholder, si hubiera logo */}
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0033a1]">
                                <i className="fa-solid fa-file-lines text-3xl"></i>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold mb-8 text-center text-gray-900 font-lexend tracking-tight">Admin CVs</h1>

                        <form onSubmit={onSubmit} autoComplete="on" className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1" htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-[#0033a1] outline-none transition-all placeholder-gray-600 text-gray-900"
                                    name="email"
                                    autoComplete="username"
                                    value={form.email}
                                    placeholder="admin@donemilio.com"
                                    onChange={onChange}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1" htmlFor="password">Contraseña</label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        className="w-full px-4 py-2.5 pr-12 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-[#0033a1] outline-none transition-all placeholder-gray-600 text-gray-900"
                                        name="password"
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={onChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-[#0033a1] transition-colors focus:outline-none"
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-[1.10rem]`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center pt-2">
                                <input
                                    id="remember"
                                    className="h-4 w-4 text-[#0033a1] focus:ring-[#0033a1] border-gray-300 rounded cursor-pointer"
                                    type="checkbox"
                                    name="remember"
                                    checked={form.remember}
                                    onChange={onChange}
                                />
                                <label className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer select-none" htmlFor="remember">
                                    Mantenerme conectado
                                </label>
                            </div>

                            <div className="pt-2">
                                <button
                                    className="w-full py-3 bg-[#0033a1] text-white font-bold rounded-xl hover:bg-blue-800 transition-colors shadow-md hover:shadow-lg flex justify-center items-center disabled:opacity-70"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Iniciando sesión...
                                        </>
                                    ) : (
                                        "Ingresar al sistema"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <p className="text-center mt-6 text-gray-400 text-xs font-medium">
                    &copy; {new Date().getFullYear()} Grupo Don Emilio
                </p>
            </div>
        </div>
    );
}
