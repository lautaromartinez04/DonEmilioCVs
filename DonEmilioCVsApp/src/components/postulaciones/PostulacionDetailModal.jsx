// src/components/postulaciones/PostulacionDetailModal.jsx
import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PostulacionesAPI } from "../../api/postulaciones";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

// Configurar el worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PostulacionDetailModal({ item, onClose }) {
  const [blob, setBlob] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [cvErr, setCvErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let revoke = null;
    (async () => {
      try {
        if (!item?.id) return;
        setLoading(true);
        const fileBlob = await PostulacionesAPI.cvInlineBlob(item.id);
        setBlob(fileBlob);
      } catch (e) {
        console.error("CV load error:", e);
        setCvErr(e?.payload?.detail || e?.message || "No se pudo cargar el CV");
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (revoke) revoke(); };
  }, [item?.id]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 lg:p-6 overflow-hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/10 border border-black/5 w-full max-w-5xl h-[95vh] flex flex-col overflow-hidden animate-[fadeIn_0.3s_ease-out_forwards]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-6 sm:px-8 py-5 border-b border-black/5 flex justify-between items-center bg-gradient-to-b from-gray-50/50 to-white shrink-0 shadow-sm shadow-black/5 relative z-10">
          <h5 className="text-xl sm:text-2xl font-bold text-gray-800 m-0 flex items-center font-[madetommy] tracking-tight">
            <div className="w-12 h-12 rounded-xl bg-blue-50/50 flex items-center justify-center text-[#0033a1] mr-4 shadow-sm border border-blue-100/50">
              <i className="fa-regular fa-id-card text-xl" />
            </div>
            {item.nombre} {item.apellido}
          </h5>
          <button type="button" className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 hover:shadow-sm" onClick={onClose} aria-label="Cerrar modal">
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 bg-gradient-to-b from-gray-100/50 to-gray-200/50 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-white/50 backdrop-blur-sm z-10">
              <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-4 text-[#0033a1] drop-shadow-sm"></i>
              <span className="text-lg font-medium tracking-wide text-gray-600 animate-pulse">Cargando documento...</span>
            </div>
          )}
          {cvErr && (
            <div className="m-8 bg-amber-50 border border-amber-200 text-amber-800 px-6 py-5 rounded-2xl flex items-center shadow-sm">
              <i className="fa-solid fa-triangle-exclamation mr-4 text-amber-500 text-2xl drop-shadow-sm"></i>
              <span className="text-lg font-medium">{cvErr}</span>
            </div>
          )}

          {!loading && !cvErr && blob && (
            <div className="flex flex-col items-center py-8 min-h-full">
              <Document
                file={blob}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                className="flex flex-col items-center gap-8 w-full px-4 sm:px-8"
              >
                {Array.from({ length: numPages || 0 }, (_, i) => (
                  <div key={i + 1} className="bg-white shadow-xl shadow-black/10 rounded-2xl overflow-hidden border border-black/5 w-full max-w-4xl flex justify-center hover:-translate-y-1 transition-transform duration-500">
                    <Page
                      pageNumber={i + 1}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="max-w-full"
                      width={Math.min(window.innerWidth - 80, 850)}
                    />
                  </div>
                ))}
              </Document>
            </div>
          )}
        </div>

        <div className="px-6 sm:px-8 py-4 border-t border-black/5 bg-white flex justify-end gap-3 shrink-0 shadow-sm shadow-black/5 z-10">
          <button type="button" className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-bold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center hover:shadow-sm active:scale-95" onClick={onClose}>
            Cerrar vista
          </button>
        </div>
      </div>
    </div>
  );
}
