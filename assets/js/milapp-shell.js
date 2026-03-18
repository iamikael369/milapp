(function () {
  const state = {
    bootedModules: new Set(),
    installPrompt: null,
    firebaseConfigPromise: null,
    listenersAttached: false,
    syncModes: {},
    installChipVisible: false,
  };

  function ensureContainer(className) {
    let el = document.querySelector(`.${className}`);
    if (!el) {
      el = document.createElement("div");
      el.className = className;
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(message, tone = "info", title = "MilApp") {
    if (!document.body) return;
    const region = ensureContainer("milapp-toast-region");
    const node = document.createElement("article");
    node.className = "milapp-toast";
    node.dataset.tone = tone;
    node.innerHTML = `
      <div class="milapp-toast-title">${title}</div>
      <div class="milapp-toast-body">${message}</div>
    `;
    region.appendChild(node);
    requestAnimationFrame(() => node.classList.add("is-visible"));
    window.setTimeout(() => {
      node.classList.remove("is-visible");
      window.setTimeout(() => node.remove(), 250);
    }, 3600);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener(
      "load",
      () => {
        navigator.serviceWorker.register("/service-worker.js").catch(() => {});
      },
      { once: true },
    );
  }

  function bindLifecycleNotices() {
    if (state.listenersAttached) return;
    state.listenersAttached = true;

    if (!navigator.onLine) {
      renderNetworkChip();
    }

    window.addEventListener("offline", () => {
      renderNetworkChip();
      toast(
        "La red se ha retirado por un momento. El templo seguirá contigo con lo ya guardado.",
        "warning",
        "Modo local",
      );
    });

    window.addEventListener("online", () => {
      removeFloatingChip("network");
      toast(
        "La conexión ha regresado. Puedes volver a sincronizar tus rituales.",
        "success",
        "Templo enlazado",
      );
    });

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.installPrompt = event;
      renderInstallChip();
    });

    window.addEventListener("appinstalled", () => {
      state.installPrompt = null;
      removeFloatingChip("install");
      toast(
        "MilApp ya puede acompañarte como refugio instalado en tu dispositivo.",
        "success",
        "Instalación completa",
      );
    });
  }

  function getFloatingStack() {
    return ensureContainer("milapp-floating-stack");
  }

  function isStandalone() {
    return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
  }

  function removeFloatingChip(type) {
    const existing = document.querySelector(`.milapp-floating-chip[data-chip="${type}"]`);
    if (existing) existing.remove();
  }

  function renderFloatingChip({ type, icon, label, onClick }) {
    const stack = getFloatingStack();
    removeFloatingChip(type);
    const chip = document.createElement("div");
    chip.className = "milapp-floating-chip";
    chip.dataset.chip = type;
    chip.innerHTML = `
      <span class="material-symbols-rounded">${icon}</span>
      <button type="button">${label}</button>
    `;
    chip.querySelector("button").addEventListener("click", onClick);
    stack.appendChild(chip);
  }

  function openInstallGuide() {
    openGuide({
      moduleId: "install-milapp",
      title: "Lleva MilApp contigo",
      steps: [
        "En Android, toca ‘Instalar MilApp’ y deja que el teléfono convierta este templo en una app propia.",
        "Si tu navegador no ofrece el rito automático, abre el menú del navegador y elige ‘Instalar app’ o ‘Agregar a pantalla de inicio’.",
        "En iPhone o iPad, abre Compartir en Safari y elige ‘Agregar a pantalla de inicio’ para guardar MilApp como un refugio permanente."
      ],
    });
  }

  async function promptInstall() {
    const promptEvent = state.installPrompt;
    if (!promptEvent) {
      openInstallGuide();
      return false;
    }

    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    state.installPrompt = null;
    renderInstallChip();
    return true;
  }

  function renderInstallChip() {
    if (!document.body) return;
    if (isStandalone()) {
      removeFloatingChip("install");
      state.installChipVisible = false;
      return;
    }
    renderFloatingChip({
      type: "install",
      icon: state.installPrompt ? "download" : "phone_iphone",
      label: state.installPrompt ? "Instalar MilApp" : "Llevar MilApp",
      onClick: () => {
        promptInstall().catch(() => openInstallGuide());
      },
    });
    state.installChipVisible = true;
  }

  function renderNetworkChip() {
    if (!document.body) return;
    renderFloatingChip({
      type: "network",
      icon: "wifi_off",
      label: "Modo local",
      onClick: () => {
        toast(
          "Sigues en modo local. MilApp conserva lo ya guardado y retomará la sincronía cuando vuelva la red.",
          "warning",
          "Sin conexión",
        );
      },
    });
  }

  function tutorialKey(moduleId) {
    return `milapp_tutorial_seen_${moduleId}`;
  }

  function openGuide({ moduleId, title, steps }) {
    let overlay = document.querySelector(".milapp-guide-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "milapp-guide-overlay";
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <section class="milapp-guide-sheet" role="dialog" aria-modal="true" aria-label="Guía de módulo">
        <div class="milapp-guide-kicker">Rito de entrada</div>
        <h2 class="milapp-guide-title">${title}</h2>
        <div class="milapp-guide-body">
          ${steps
            .map(
              (step, index) =>
                `<div class="milapp-guide-step" data-step="${index + 1}">${step}</div>`,
            )
            .join("")}
        </div>
        <div class="milapp-guide-actions">
          <button type="button" class="milapp-guide-btn" data-action="close">Cerrar</button>
          <button type="button" class="milapp-guide-btn is-primary" data-action="remember">Entendido</button>
        </div>
      </section>
    `;

    const close = () => {
      overlay.classList.remove("is-open");
      window.setTimeout(() => {
        if (!overlay.classList.contains("is-open")) overlay.innerHTML = "";
      }, 250);
    };

    overlay.addEventListener(
      "click",
      (event) => {
        if (event.target === overlay) close();
      },
      { once: true },
    );

    overlay.querySelector('[data-action="close"]').addEventListener("click", close);
    overlay.querySelector('[data-action="remember"]').addEventListener("click", () => {
      localStorage.setItem(tutorialKey(moduleId), "true");
      close();
    });

    requestAnimationFrame(() => overlay.classList.add("is-open"));
  }

  async function fetchFirebaseConfig() {
    if (!state.firebaseConfigPromise) {
      state.firebaseConfigPromise = fetch("/api/firebase-config")
        .then((response) => (response.ok ? response.json() : {}))
        .catch(() => ({}));
    }
    return state.firebaseConfigPromise;
  }

  function setSyncMode({
    module,
    mode,
    badgeSelector,
    badgeText,
    noticeSelector,
    noticeText,
    toastMessage,
    title = "Sincronía",
  }) {
    if (!module) return;

    state.syncModes[module] = mode;

    if (badgeSelector) {
      const badge = document.querySelector(badgeSelector);
      if (badge) {
        badge.classList.add("milapp-sync-badge");
        badge.dataset.mode = mode;
        if (badgeText) badge.innerText = badgeText;
      }
    }

    if (noticeSelector) {
      const notice = document.querySelector(noticeSelector);
      if (notice) {
        notice.dataset.mode = mode;
        if (noticeText) {
          const textTarget = notice.querySelector("[data-sync-text]") || notice;
          textTarget.textContent = noticeText;
        }
        notice.classList.toggle("hidden", mode !== "local");
      }
    }

    if (toastMessage) {
      const toastKey = `milapp_sync_notice_${module}_${mode}`;
      if (!sessionStorage.getItem(toastKey)) {
        sessionStorage.setItem(toastKey, "true");
        toast(toastMessage, mode === "local" ? "warning" : "success", title);
      }
    }
  }

  async function generate(prompt, { quiet = false } = {}) {
    try {
      if (window.Universo?.callGemini) {
        const result = await window.Universo.callGemini(prompt);
        if (
          !quiet &&
          typeof result === "string" &&
          result.includes("El oráculo descansa")
        ) {
          toast(result, "warning", "Oráculo");
        }
        return result;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json().catch(() => ({}));
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
      if (!quiet) {
        toast(
          "El oráculo no pudo responder. MilApp conservará el modo contemplativo hasta que vuelva la conexión.",
          "warning",
          "Oráculo",
        );
      }
      return "";
    }
  }

  function bootstrap(options = {}) {
    const moduleId = options.module || document.body?.dataset?.module || "milapp";
    if (!document.body || state.bootedModules.has(moduleId)) return;

    state.bootedModules.add(moduleId);
    document.body.classList.add("milapp-shell-ready");
    document.body.dataset.module = moduleId;

    registerServiceWorker();
    bindLifecycleNotices();
    renderInstallChip();

    if (options.welcomeMessage) {
      const key = `milapp_boot_notice_${moduleId}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "true");
        toast(options.welcomeMessage, "info", options.title || "MilApp");
      }
    }

    if (Array.isArray(options.tutorial) && options.tutorial.length > 0) {
      renderFloatingChip({
        type: `guide-${moduleId}`,
        icon: "menu_book",
        label: "Guía",
        onClick: () =>
          openGuide({
            moduleId,
            title: options.title || "Guía del templo",
            steps: options.tutorial,
          }),
      });

      if (!localStorage.getItem(tutorialKey(moduleId))) {
        window.setTimeout(() => {
          openGuide({
            moduleId,
            title: options.title || "Guía del templo",
            steps: options.tutorial,
          });
        }, options.tutorialDelay || 600);
      }
    }
  }

  window.MilApp = {
    bootstrap,
    toast,
    guide: { open: openGuide },
    ai: { generate },
    firebase: { getConfig: fetchFirebaseConfig },
    sync: {
      setLocal: (options = {}) => setSyncMode({ ...options, mode: "local" }),
      setCloud: (options = {}) => setSyncMode({ ...options, mode: "cloud" }),
      getMode: (module) => state.syncModes[module] || null,
    },
    install: {
      open: () => openInstallGuide(),
      trigger: () => promptInstall(),
      available: () => Boolean(state.installPrompt),
    },
  };
})();
