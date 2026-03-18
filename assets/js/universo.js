/**
 * UNIVERSO.JS
 * Lógica compartida para MilApp - Manejo de perfiles, IA y comunicación.
 */

// API Key gestionada por server.py

// --- 1. GESTIÓN DE PERFILES (Database Local) ---
const DEFAULT_PROFILES = [
  {
    id: "mila_admin",
    name: "Mila",
    fullname: "Emily Gricell Dimas Vicent",
    dob: "1992-12-06",
    time: "20:30",
    place: "Maturín, Venezuela",
    color: "#a855f7",
    gender: "F",
    active: true,
    photoUrl: "assets/images/icons/Mila.jpg", // Foto UI real (.jpg en icons)
    aiReferenceUrl: "assets/images/Mila.png", // Referencia IA real (.png original)
    aiReadings: {},
  },
  {
    id: "miguelo_admin",
    name: "Miguelo",
    fullname: "Miguelangel Pulido Perez",
    dob: "1994-05-19",
    time: "14:05",
    place: "Caracas, Venezuela",
    color: "#3b82f6",
    gender: "M",
    active: false,
    photoUrl: "assets/images/icons/Miguelo.jpg", // Foto UI real (.jpg en icons)
    aiReferenceUrl: "assets/images/Miguelo.png", // Referencia IA real (.png original)
    aiReadings: {},
  },
];

const Universo = {
  // --- Perfiles ---
  getProfiles: () => {
    let profiles = JSON.parse(localStorage.getItem("mila_profiles"));
    if (!profiles || profiles.length === 0) {
      profiles = DEFAULT_PROFILES;
      localStorage.setItem("mila_profiles", JSON.stringify(profiles));
    }
    return profiles;
  },

  getActiveProfile: () => {
    const profiles = Universo.getProfiles();
    return profiles.find((p) => p.active) || profiles[0];
  },

  saveProfiles: (profiles) => {
    localStorage.setItem("mila_profiles", JSON.stringify(profiles));
  },

  setActiveProfile: (id) => {
    const profiles = Universo.getProfiles();
    profiles.forEach((p) => (p.active = p.id === id));
    Universo.saveProfiles(profiles);
    // Notificar cambio globalmente
    Universo.sendMessage("PROFILE_UPDATED", {
      name: profiles.find((p) => p.id === id).name,
    });
    return profiles.find((p) => p.id === id);
  },

  createNewProfile: (data) => {
    const profiles = Universo.getProfiles();
    const newProfile = {
      id: "user_" + Date.now(),
      active: true, // Auto activar nuevo
      photoUrl: data.photoUrl || "", // Soporte para fotos UI
      aiReferenceUrl: data.aiReferenceUrl || "", // Soporte para referencia IA
      aiReadings: {},
      ...data,
    };
    // Desactivar otros
    profiles.forEach((p) => (p.active = false));
    profiles.push(newProfile);
    Universo.saveProfiles(profiles);
    Universo.sendMessage("PROFILE_UPDATED", { name: newProfile.name });
    return newProfile;
  },

  updateProfile: (id, data) => {
    const profiles = Universo.getProfiles();
    const idx = profiles.findIndex((p) => p.id === id);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...data };
      Universo.saveProfiles(profiles);
      Universo.sendMessage("PROFILE_UPDATED", { name: profiles[idx].name });
      return profiles[idx];
    }
    return null;
  },

  // --- Comunicación (Cross-Frame) ---
  sendMessage: (type, payload = {}) => {
    // Enviar al padre (si somos iframe)
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type, ...payload }, "*");
    }
    // Enviar a hijos (si somos shell)
    const iframe = document.getElementById("module-viewer");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type, ...payload }, "*");
    }
  },

  listen: (handlers) => {
    window.addEventListener("message", (event) => {
      const data = event.data;
      if (handlers[data.type]) {
        handlers[data.type](data);
      }
    });
  },

  // --- IA (Gemini - Local Server) ---
  _aiAvailable: null,

  callGemini: async (prompt) => {
    const FALLBACK = "\u2726 El oráculo descansa en este momento — su silencio también es sabiduría. Intenta más tarde cuando el servidor esté disponible. \u2726";
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "HTTP " + response.status);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.details || data.error);

      Universo._aiAvailable = true;
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "El universo guarda silencio..."
      );
    } catch (e) {
      Universo._aiAvailable = false;
      Universo._disableAIButtons();
      return FALLBACK;
    }
  },

  _disableAIButtons: () => {
    const tooltip = "El oráculo descansa — intenta más tarde";
    document.querySelectorAll(
      "[onclick*=\"callGemini\"],[onclick*=\"aiInterpret\"],[onclick*=\"aiGenerate\"],[onclick*=\"askAbundanceGuide\"],[onclick*=\"getInspiration\"]"
    ).forEach((btn) => {
      if (!btn.dataset.aiDisabled) {
        btn.dataset.aiDisabled = "1";
        btn.setAttribute("title", tooltip);
        btn.style.opacity = "0.45";
        btn.style.cursor = "not-allowed";
        btn.style.pointerEvents = "none";
      }
    });
    const interpretBtn = document.getElementById("interpretBtn");
    if (interpretBtn && !interpretBtn.dataset.aiDisabled) {
      interpretBtn.dataset.aiDisabled = "1";
      interpretBtn.setAttribute("title", tooltip);
      interpretBtn.style.opacity = "0.45";
      interpretBtn.style.cursor = "not-allowed";
      interpretBtn.style.pointerEvents = "none";
    }
  },

  // --- Navegación ---
  goHome: () => {
    Universo.sendMessage("CLOSE_MODULE");
  },

  openModule: (url) => {
    Universo.sendMessage("OPEN_MODULE", { url });
  },

  // --- UI Helpers ---
  renderProfileSelector: (containerId, onSelectCallback) => {
    const profiles = Universo.getProfiles();
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = profiles
      .map(
        (p) => `
            <div class="p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex justify-between items-center profile-item" data-id="${p.id}">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style="background-color: ${p.color}; color: white">
                        ${p.name.charAt(0)}
                    </div>
                    <span class="text-sm text-gray-200">${p.name}</span>
                </div>
                ${p.active ? '<span class="text-yellow-400 material-symbols-rounded text-sm">check_circle</span>' : ""}
            </div>
        `,
      )
      .join("");

    container.querySelectorAll(".profile-item").forEach((item) => {
      item.addEventListener("click", () => {
        const newProfile = Universo.setActiveProfile(item.dataset.id);
        if (onSelectCallback) onSelectCallback(newProfile);
      });
    });
  },

  // --- Privacidad y Filtrado ---
  canView: (item) => {
    const activeProfile = Universo.getActiveProfile();
    if (!item.owner) return true; // Para datos antiguos
    return item.owner === activeProfile.id || item.visibility === "shared";
  },

  filterPrivateData: (list) => {
    return list.filter(Universo.canView);
  },

  // --- Backup Universal ---
  exportUniverse: () => {
    const data = {
      profiles: Universo.getProfiles(),
      config: JSON.parse(localStorage.getItem("mila_config_v1")),
      dreams: JSON.parse(localStorage.getItem("mila_dreams")),
      desires: JSON.parse(localStorage.getItem("mila_desires")),
      dreamMap: JSON.parse(localStorage.getItem("mila_dream_map")),
      version: "4.0 (Identidad Unificada)",
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `universo_mila_completo_${new Date().toISOString().slice(0, 10)}.mila`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importUniverse: (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.profiles) Universo.saveProfiles(imported.profiles);
        if (imported.dreams)
          localStorage.setItem("mila_dreams", JSON.stringify(imported.dreams));
        if (imported.desires)
          localStorage.setItem(
            "mila_desires",
            JSON.stringify(imported.desires),
          );
        if (imported.dreamMap)
          localStorage.setItem(
            "mila_dream_map",
            JSON.stringify(imported.dreamMap),
          );
        if (callback) callback(true);
      } catch (err) {
        console.error(err);
        if (callback) callback(false);
      }
    };
    reader.readAsText(file);
  },
};

// Exponer globalmente
window.Universo = Universo;
