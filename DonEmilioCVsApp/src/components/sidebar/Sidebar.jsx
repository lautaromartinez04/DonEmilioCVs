// src/components/sidebar/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/dashboard", icon: "fa-solid fa-gauge-high", label: "Dashboard" },
  { to: "/postulaciones", icon: "fa-solid fa-file-lines", label: "Postulaciones" },
  { to: "/unidades", icon: "fa-solid fa-building", label: "Unidades de Negocio" },
  { to: "/usuarios", icon: "fa-solid fa-users", label: "Usuarios" },
];

export default function Sidebar() {
  const [isHovered, setIsHovered] = React.useState(false);
  const collapsed = !isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-gray-950/95 backdrop-blur-2xl border-r border-white/5 shadow-2xl shadow-black flex flex-col transition-all duration-300 relative z-50 h-full overflow-hidden ${collapsed ? "w-20" : "w-64"}`}
    >
      <div className="h-16 flex items-center justify-center border-b border-white/5 relative group shrink-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="font-[Lexend] font-bold text-brand-500 text-2xl relative z-10 transition-transform duration-300 flex items-center justify-center w-full h-full whitespace-nowrap">
          <span className={`transition-all duration-300 ${collapsed ? "opacity-100 scale-100 absolute" : "opacity-0 scale-50 absolute"}`}>CVs</span>
          <span className={`transition-all duration-300 tracking-tight text-xl ${collapsed ? "opacity-0 scale-50 absolute" : "opacity-100 scale-100 relative"}`}>DON EMILIO CVs</span>
        </div>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            title={collapsed ? it.label : ""}
            className={({ isActive }) =>
              `flex items-center px-3 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/25 font-bold relative"
                : "text-gray-400 hover:bg-white/5 hover:text-gray-100 font-medium hover:shadow-sm"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="w-8 flex items-center justify-center shrink-0">
                  <i className={`${it.icon} text-[1.15rem] transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-sm text-white" : "group-hover:scale-110 text-brand-400 group-hover:text-brand-300"}`} />
                </div>
                <span className={`ml-3 truncate tracking-wide whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0 pointer-events-none" : "w-40 opacity-100"}`}>
                  {it.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
