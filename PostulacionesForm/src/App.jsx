import React from "react";
import PostulacionForm from "./components/PostulacionesForm";

export default function App() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen flex flex-col justify-center">
      {/* Header con logo + título */}
      <header className="flex flex-col items-center mb-8">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-16 mb-2 object-contain"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </header>

      {/* Contenido principal */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="backdrop-blur-md bg-white/85 border border-black/5 shadow-2xl rounded-3xl overflow-hidden">
            <div className="p-6 md:p-10">
              <h1 className="text-center text-4xl font-extrabold font-[madetommy] text-gray-900 tracking-tight">
                Grupo DON EMILIO
              </h1>
              <p className="text-center text-gray-500 mt-1 mb-6">
                Trabaja con nosotros
              </p>

              <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#0033a1] to-transparent border-0 mb-8 opacity-80"></div>

              <PostulacionForm />
            </div>
          </div>

          {/* Nota al pie */}
          <p className="text-center text-gray-400 mt-6 text-sm flex flex-col items-center justify-center">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-lock text-xs"></i>
              Tus datos se envían de forma segura.
            </span>
            <span className="text-xs mt-1 font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Powered By Don Emilio DEVs</span>
          </p>
        </div>
      </div>
    </div>
  );
}
