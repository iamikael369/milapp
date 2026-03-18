/**
 * Módulo: Diario / Bitácora
 * Descripción: Gestión de sueños y manifestaciones (SPEC).
 */

class DiarioModule {
    constructor() {
        this.dreams = JSON.parse(localStorage.getItem('mila_dreams')) || [];
        this.desires = JSON.parse(localStorage.getItem('mila_desires')) || [];
        this.mode = 'moon'; // 'moon' | 'sun'
        this.tempType = 'normal';
    }

    async render(container) {
        console.log("Diario: Renderizando...");
        container.innerHTML = `
            <!-- HEADER DEL MÓDULO -->
            <header class="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center fade-in">
                <div class="flex gap-3 items-center">
                    <button onclick="Universo.goHome()" class="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-gray-400">
                        <span class="material-symbols-rounded text-lg">arrow_back</span>
                    </button>
                    <div class="toggle-container">
                        <div class="toggle-bg"></div>
                        <button class="toggle-btn active" id="btn-moon">🌙</button>
                        <button class="toggle-btn" id="btn-sun">☀️</button>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] text-gray-400 flex items-center gap-1">
                        <span class="material-symbols-rounded text-sm" id="counter-icon">nights_stay</span>
                        <span id="item-count">0</span>
                    </div>
                </div>
            </header>

            <!-- MAIN CONTENT -->
            <main class="px-4 py-6 min-h-[60vh] pb-24 fade-in">
                <!-- BUSCADOR -->
                <div class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 mb-6">
                    <span class="material-symbols-rounded text-gray-500">search</span>
                    <input type="text" id="diario-search" placeholder="Buscar en el archivo..." 
                        class="bg-transparent border-none text-sm text-white w-full outline-none">
                </div>

                <!-- LISTAS -->
                <div id="view-moon" class="space-y-4">
                    <div id="empty-moon" class="hidden text-center py-20 opacity-50">
                        <span class="material-symbols-rounded text-6xl text-purple-400/50 mb-4">cloud_off</span>
                        <p class="font-playfair text-gray-400 text-sm">El silencio de la noche espera tus sueños.</p>
                    </div>
                    <div id="list-moon" class="space-y-3"></div>
                </div>

                <div id="view-sun" class="hidden space-y-4">
                    <div id="empty-sun" class="hidden text-center py-20 opacity-50">
                        <span class="material-symbols-rounded text-6xl text-yellow-500/50 mb-4">light_mode</span>
                        <p class="font-playfair text-gray-400 text-sm">El día espera tu intención.</p>
                    </div>
                    <div id="list-sun" class="space-y-3"></div>
                </div>
            </main>

            <!-- FAB -->
            <button id="fab-add" class="fab fade-in">
                <span class="material-symbols-rounded text-3xl" id="fab-icon">add</span>
            </button>

            <!-- MODAL EDITOR -->
            <div id="editor-modal" class="modal-overlay">
                <div class="w-full h-full bg-[#0a0519] flex flex-col">
                    <div class="p-4 flex justify-between items-center border-b border-white/10 bg-black/50">
                        <div class="flex gap-4">
                            <button id="tab-simple" class="editor-tab-btn active">Simple</button>
                            <button id="tab-advanced" class="editor-tab-btn">Profundo</button>
                        </div>
                        <button id="close-editor" class="text-gray-400 hover:text-white">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-5 space-y-5">
                        <div class="flex flex-col gap-2">
                             <label id="editor-title-label" class="text-xs text-gray-500 uppercase tracking-widest">Título</label>
                             <input type="text" id="entry-title" placeholder="..." 
                                class="glass-input font-bold text-lg bg-transparent border-0 border-b border-white/20 rounded-none px-0 focus:border-white focus:ring-0">
                        </div>

                        <textarea id="entry-content" placeholder="Escribe aquí..." class="glass-input glass-textarea text-base h-full"></textarea>

                        <!-- AVANZADO -->
                        <div id="advanced-options" class="hidden space-y-6 pt-4 border-t border-white/10">
                            <!-- Moon Options -->
                            <div id="moon-adv" class="hidden">
                                <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Tipo de Sueño</p>
                                <div class="flex gap-2 overflow-x-auto no-scrollbar">
                                    <button class="type-btn px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400" data-val="normal">Normal</button>
                                    <button class="type-btn px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400" data-val="lucido">Lúcido</button>
                                    <button class="type-btn px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400" data-val="pesadilla">Pesadilla</button>
                                    <button class="type-btn px-3 py-1 rounded-full border border-white/10 text-xs text-gray-400" data-val="magico">Mágico</button>
                                </div>
                            </div>
                            
                            <!-- Sun Options (SPEC) -->
                            <div id="sun-adv" class="hidden space-y-4">
                                <div class="p-4 bg-white/5 rounded-xl border border-yellow-500/20">
                                    <p class="font-cinzel text-xs text-yellow-200 mb-2">Método S.P.E.C.</p>
                                    <button id="btn-spec" class="w-full py-2 bg-yellow-600/20 border border-yellow-500/50 rounded-lg text-[10px] font-bold text-yellow-100 uppercase hover:bg-yellow-600/30 flex items-center justify-center gap-2">
                                        <span class="material-symbols-rounded text-sm">auto_awesome</span> Aplicar Método con IA
                                    </button>
                                    <div id="spec-results" class="hidden mt-4 space-y-3 pt-3 border-t border-white/10">
                                        <textarea id="spec-project" class="glass-input text-xs italic bg-black/20" rows="2" readonly placeholder="Project..."></textarea>
                                        <input type="text" id="spec-expect" class="glass-input text-xs font-bold text-center bg-black/20" readonly placeholder="Expect...">
                                        <p id="spec-collect" class="text-xs text-gray-400 italic"></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 border-t border-white/10 bg-black/80 flex justify-end">
                        <button id="save-btn" class="px-8 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg bg-white/10 hover:bg-white/20 transition">
                            Guardar
                        </button>
                    </div>
                </div>
            </div>

            <!-- VISOR DETALLE -->
            <div id="viewer-modal" class="modal-overlay">
                 <div class="w-full h-full bg-black/95 flex flex-col">
                    <div class="p-4 flex justify-between items-center border-b border-white/10">
                        <button id="close-viewer" class="text-gray-400 hover:text-white"><span class="material-symbols-rounded">arrow_back</span></button>
                        <div class="flex gap-4">
                             <button id="delete-entry" class="text-red-400 hover:text-red-300"><span class="material-symbols-rounded">delete</span></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <div id="dream-visual" class="dream-canvas bg-gradient-to-br from-gray-800 to-black relative w-full h-48 rounded-xl mb-4 flex items-center justify-center">
                             <span class="material-symbols-rounded text-4xl text-white/20">image</span>
                        </div>
                        <h2 id="view-title" class="font-cinzel text-2xl text-white mb-2 leading-tight">Título</h2>
                        <span class="text-xs text-gray-500 font-mono mb-6 block" id="view-date">--</span>
                        <p id="view-content" class="text-sm text-gray-300 leading-relaxed font-serif whitespace-pre-wrap mb-8">...</p>
                        <div id="view-footer"></div>
                    </div>
                 </div>
            </div>
        `;
    }

    async init() {
        console.log("Diario: Iniciando...");
        this.setMode('moon');

        // Listeners
        this.bindEvents();

        // Initial Render
        this.renderList();
        console.log("Diario: Inicializado.");
    }

    bindEvents() {
        // Mode Toggles
        document.getElementById('btn-moon').onclick = () => this.setMode('moon');
        document.getElementById('btn-sun').onclick = () => this.setMode('sun');

        // Search
        document.getElementById('diario-search').oninput = (e) => this.renderList(e.target.value);

        // Editor
        document.getElementById('fab-add').onclick = () => this.openEditor();
        document.getElementById('close-editor').onclick = () => document.getElementById('editor-modal').classList.remove('active');
        document.getElementById('tab-simple').onclick = () => this.setEditorTab('simple');
        document.getElementById('tab-advanced').onclick = () => this.setEditorTab('advanced');

        // Save
        document.getElementById('save-btn').onclick = () => this.saveEntry();

        // Viewer
        document.getElementById('close-viewer').onclick = () => document.getElementById('viewer-modal').classList.remove('active');
        document.getElementById('delete-entry').onclick = () => this.deleteEntry();

        // Type buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.onclick = () => {
                this.tempType = btn.dataset.val;
                document.querySelectorAll('.type-btn').forEach(b => {
                    b.style.borderColor = 'rgba(255,255,255,0.1)';
                    b.style.color = '#9ca3af';
                });
                btn.style.borderColor = 'var(--moon-primary)';
                btn.style.color = 'white';
            };
        });

        // SPEC IA
        document.getElementById('btn-spec').onclick = () => this.generateSPEC();
    }

    setMode(mode) {
        this.mode = mode;
        const btnMoon = document.getElementById('btn-moon');
        const btnSun = document.getElementById('btn-sun');
        const viewMoon = document.getElementById('view-moon');
        const viewSun = document.getElementById('view-sun');
        const fabIcon = document.getElementById('fab-icon');
        const saveBtn = document.getElementById('save-btn');
        const toggleBg = document.querySelector('.toggle-bg');

        if (mode === 'moon') {
            btnMoon.classList.add('active');
            btnSun.classList.remove('active');
            viewMoon.classList.remove('hidden');
            viewSun.classList.add('hidden');
            fabIcon.innerText = 'bedtime';
            saveBtn.className = "px-8 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg bg-purple-600 hover:bg-purple-500 transition";
            toggleBg.style.transform = 'translateX(0)';
            toggleBg.style.background = 'linear-gradient(to bottom, #1e1b4b, #312e81)';
            this.renderList();
        } else {
            btnMoon.classList.remove('active');
            btnSun.classList.add('active');
            viewMoon.classList.add('hidden');
            viewSun.classList.remove('hidden');
            fabIcon.innerText = 'wb_sunny';
            saveBtn.className = "px-8 py-3 rounded-xl text-black font-bold text-xs uppercase tracking-widest shadow-lg bg-yellow-500 hover:bg-yellow-400 transition";
            toggleBg.style.transform = 'translateX(100%)';
            toggleBg.style.background = 'linear-gradient(to bottom, #fbbf24, #f59e0b)';
            this.renderList();
        }
    }

    renderList(filter = "") {
        const listContainer = this.mode === 'moon' ? document.getElementById('list-moon') : document.getElementById('list-sun');
        const emptyState = this.mode === 'moon' ? document.getElementById('empty-moon') : document.getElementById('empty-sun');
        const data = this.mode === 'moon' ? this.dreams : this.desires;

        listContainer.innerHTML = '';

        let filtered = data;
        if (filter) {
            filtered = data.filter(item => item.title.toLowerCase().includes(filter.toLowerCase()));
        }

        document.getElementById('item-count').innerText = filtered.length;

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }
        emptyState.classList.add('hidden');

        filtered.forEach(item => {
            const dateStr = new Date(item.date).toLocaleDateString();
            const card = document.createElement('div');
            card.className = `glass-card cursor-pointer mb-3 border-l-4 ${this.mode === 'moon' ? 'border-purple-500/30' : 'border-yellow-500/50'}`;
            card.innerHTML = `
                <div class="flex justify-between mb-1">
                    <span class="text-[10px] text-gray-400 font-mono">${dateStr}</span>
                    ${item.completed ? '<span class="text-green-400 text-[10px]">✔ Hecho</span>' : ''}
                </div>
                <h3 class="font-cinzel text-base text-white mb-1 line-clamp-1">${item.title}</h3>
                <p class="text-xs text-gray-400 line-clamp-2 font-serif">${item.content || item.decree}</p>
            `;
            card.onclick = () => this.openViewer(item.id);
            listContainer.appendChild(card);
        });
    }

    // --- EDITOR ---
    openEditor() {
        document.getElementById('editor-modal').classList.add('active');
        document.getElementById('entry-title').value = '';
        document.getElementById('entry-content').value = '';
        this.setEditorTab('simple');

        const titleLabel = document.getElementById('editor-title-label');
        if (this.mode === 'moon') {
            titleLabel.innerText = "Sueño";
            document.getElementById('entry-title').placeholder = "Título del sueño...";
        } else {
            titleLabel.innerText = "Intención";
            document.getElementById('entry-title').placeholder = "¿Qué deseas manifestar?";
        }
    }

    setEditorTab(tab) {
        document.querySelectorAll('.editor-tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');
        const adv = document.getElementById('advanced-options');
        if (tab === 'simple') {
            adv.classList.add('hidden');
        } else {
            adv.classList.remove('hidden');
            document.getElementById('moon-adv').classList.toggle('hidden', this.mode !== 'moon');
            document.getElementById('sun-adv').classList.toggle('hidden', this.mode !== 'sun');
        }
    }

    saveEntry() {
        const title = document.getElementById('entry-title').value;
        const content = document.getElementById('entry-content').value;
        if (!title && !content) return;

        const id = Date.now();
        const date = new Date().toISOString();

        if (this.mode === 'moon') {
            const entry = { id, date, title: title || "Sueño", content, type: this.tempType };
            this.dreams.unshift(entry);
            localStorage.setItem('mila_dreams', JSON.stringify(this.dreams));
        } else {
            const decree = document.getElementById('spec-expect').value; // if generated
            const entry = {
                id, date, title: title || "Intención", content,
                decree: decree || title,
                visual: document.getElementById('spec-project').value,
                completed: false
            };
            this.desires.unshift(entry);
            localStorage.setItem('mila_desires', JSON.stringify(this.desires));
        }

        document.getElementById('editor-modal').classList.remove('active');
        this.renderList();
    }

    // --- VIEWER ---
    openViewer(id) {
        const list = this.mode === 'moon' ? this.dreams : this.desires;
        const item = list.find(i => i.id === id);
        if (!item) return;

        this.previewId = id;
        document.getElementById('viewer-modal').classList.add('active');
        document.getElementById('view-title').innerText = item.title;
        document.getElementById('view-content').innerText = item.content;
        document.getElementById('view-date').innerText = new Date(item.date).toLocaleDateString();

        const visual = document.getElementById('dream-visual');
        if (this.mode === 'moon') {
            visual.className = "dream-canvas bg-gradient-to-br from-purple-900 to-black relative w-full h-48 rounded-xl mb-4 flex items-center justify-center";
        } else {
            visual.className = "dream-canvas bg-gradient-to-br from-yellow-600 to-black relative w-full h-48 rounded-xl mb-4 flex items-center justify-center";
        }
    }

    deleteEntry() {
        if (!confirm("¿Borrar esta memoria?")) return;
        if (this.mode === 'moon') this.dreams = this.dreams.filter(i => i.id !== this.previewId);
        else this.desires = this.desires.filter(i => i.id !== this.previewId);

        localStorage.setItem(this.mode === 'moon' ? 'mila_dreams' : 'mila_desires', JSON.stringify(this.mode === 'moon' ? this.dreams : this.desires));
        document.getElementById('viewer-modal').classList.remove('active');
        this.renderList();
    }

    // --- IA ---
    async generateSPEC() {
        const desire = document.getElementById('entry-content').value;
        if (!desire) return Universo.UI.toast("Escribe tu deseo primero...");

        const btn = document.getElementById('btn-spec');
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Conectando...`;

        const prompt = `Aplica el método SPEC de Helen Hadsell para este deseo: "${desire}". 
        1. PROJECT: Describe una escena visual corta enfocada en la emoción del logro.
        2. EXPECT: Crea un decreto de confianza absoluta en presente (ya es mío).
        3. COLLECT: Una acción física pequeña.
        Formato: VISUAL|DECRETO|ACCION`;

        const result = await Universo.AI.call(prompt);
        if (result) {
            const parts = result.split('|');
            if (parts.length >= 3) {
                document.getElementById('spec-project').value = parts[0];
                document.getElementById('spec-expect').value = parts[1];
                document.getElementById('spec-collect').innerText = parts[2];
                document.getElementById('spec-results').classList.remove('hidden');
            }
        }
        btn.innerHTML = originalText;
    }
}

// Registrar módulo
if (!window.MilAppModules) window.MilAppModules = {};
window.MilAppModules.diario = DiarioModule;
