/* Simulador Obras por Terceros: lógica de pantallas y formulario. */
(function () {
  "use strict";

  const D = window.SIM_DATA;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const screen = $("#screen");
  const STORE_KEY = "simOxt.actas.v1";

  // ---------- Íconos ----------
  const ICON = {
    camera: '<svg viewBox="0 0 40 40"><rect x="4" y="11" width="32" height="22" rx="2"/><path d="M13 11l3-4h8l3 4"/><circle cx="20" cy="22" r="6"/><path d="M8 15h3"/></svg>',
    folder: '<svg viewBox="0 0 40 40"><path d="M4 9h11l3 4h18v20H4z"/><path d="M4 16h32"/></svg>',
    mic: '<svg viewBox="0 0 40 40"><rect x="15" y="5" width="10" height="19" rx="5"/><path d="M10 19a10 10 0 0020 0M20 29v6M14 35h12"/></svg>',
    clip: '<svg viewBox="0 0 40 40"><path d="M27 12L14 25a3.5 3.5 0 005 5l14-14a6 6 0 00-9-9L9 22a8.5 8.5 0 0012 12l11-11"/></svg>',
    sign: '<svg viewBox="0 0 40 40"><path d="M24 7l5 5-13 13-6 1 1-6z"/><path d="M21 10l5 5"/><path d="M6 33c3-4 6-4 7-2s-1 4 1 4 4-5 7-5 2 3 5 3 4-2 6-2"/></svg>',
    trash: '<svg viewBox="0 0 40 40"><path d="M8 10h24M15 10V6h10v4M10 10l2 25h16l2-25M17 15v15M23 15v15"/></svg>',
    plus: '<svg viewBox="0 0 40 40"><path d="M20 8v24M8 20h24"/></svg>',
    target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/></svg>',
    xcircle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M5 9l7 7 7-7"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M3 13l6 6L21 5"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M9 4l8 8-8 8"/></svg>'
  };

  // ---------- Estado ----------
  let state = null;   // acta en curso
  let ui = null;      // estado de interfaz (desplegables abiertos, errores)
  let view = "home";

  function nuevaActividad() {
    return { descripcion: "", foto: null, audio: null, video: null, avance: "" };
  }

  function nuevaActa(obra) {
    const defectos = {};
    D.defectos.forEach(d => { defectos[d.id] = { tiene: "No", detalle: [] }; });
    return {
      obra: JSON.parse(JSON.stringify(obra)),
      fotoObra: null,
      ubicacion: { lat: obra.lat, lng: obra.lng },
      subcontratista: "",
      material: [],
      fase: [],
      hito: [],
      defecto: "No",
      defectos: defectos,
      accion: { solucionadoEnDia: "" },
      ordenServicio: { notas: "" },
      descripcionDefecto: "",
      dniSoldador: "",
      jefeObra: "",
      firmaJefe: null,
      firmaInicial: null,
      actividades: [nuevaActividad()],
      actIdx: 0,
      page: 1
    };
  }

  function nuevaUI() {
    return { open: {}, groups: { defecto: true, accion: true, orden: false, registro: true }, errors: {} };
  }

  // ---------- Utilidades ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function dms(v, pos, neg) {
    const a = Math.abs(v);
    const deg = Math.floor(a);
    const min = Math.floor((a - deg) * 60);
    return deg + "°" + String(min).padStart(2, "0") + "'" + (v < 0 ? neg : pos);
  }
  function coordText(u) {
    if (!u) return "";
    return dms(u.lat, "N", "S") + " " + dms(u.lng, "E", "W");
  }

  let toastTimer = null;
  function toast(msg, ms) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, ms || 2600);
  }

  function loadSaved() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveSaved(list) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; }
    catch (e) {
      // Si no entra (fotos pesadas), se guarda sin multimedia.
      try {
        const light = list.map(stripMedia);
        localStorage.setItem(STORE_KEY, JSON.stringify(light));
        toast("Guardado sin fotos ni firmas (sin espacio en el navegador)");
        return true;
      } catch (e2) { return false; }
    }
  }
  function stripMedia(a) {
    const c = JSON.parse(JSON.stringify(a));
    c.fotoObra = c.fotoObra ? "[foto]" : null;
    c.firmaJefe = c.firmaJefe ? "[firma]" : null;
    c.firmaInicial = c.firmaInicial ? "[firma]" : null;
    c.actividades.forEach(x => {
      x.foto = x.foto ? "[foto]" : null;
      x.audio = x.audio ? "[audio]" : null;
    });
    return c;
  }

  // Comprime una imagen elegida a JPEG chico para poder guardarla.
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = reject;
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 900;
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = reject;
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  function pickFile(accept, capture) {
    return new Promise(resolve => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = accept;
      if (capture) inp.setAttribute("capture", capture);
      inp.onchange = () => resolve(inp.files && inp.files[0] ? inp.files[0] : null);
      inp.click();
    });
  }

  // ---------- Mapa ilustrativo ----------
  function mapSvg(u) {
    // Mapa dibujado (no es un mapa real): grilla de calles girada, ruta y marcador.
    let s = '<svg class="map-svg" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice">';
    s += '<rect width="400" height="150" fill="#f6f1d4"/>';
    s += '<g stroke="#ffffff" stroke-width="3" transform="rotate(-18 200 75)">';
    for (let x = -100; x < 520; x += 22) s += '<line x1="' + x + '" y1="-80" x2="' + x + '" y2="240"/>';
    for (let y = -80; y < 240; y += 20) s += '<line x1="-100" y1="' + y + '" x2="520" y2="' + y + '"/>';
    s += '</g><g stroke="#d9d4b8" stroke-width="1" fill="none" transform="rotate(-18 200 75)">';
    for (let x = -100; x < 520; x += 22) s += '<line x1="' + x + '" y1="-80" x2="' + x + '" y2="240"/>';
    s += '</g>';
    s += '<path d="M270 150 C 320 110, 340 80, 400 60" stroke="#e8936a" stroke-width="8" fill="none"/>';
    s += '<path d="M250 10 C 300 20, 350 30, 400 40" stroke="#f0b49a" stroke-width="4" fill="none"/>';
    s += '<g transform="translate(200 40)"><path d="M0 0c-10 0-17 7-17 16 0 11 17 28 17 28s17-17 17-28C17 7 10 0 0 0z" fill="#4b7fbf"/><circle cx="0" cy="15" r="6" fill="#fff"/></g>';
    s += '</svg>';
    return s;
  }

  // ---------- Controles reutilizables ----------
  function optHtml(type, name, value, checked, label) {
    return '<label class="opt"><input type="' + type + '" name="' + esc(name) + '" value="' + esc(value) + '"' +
      (checked ? " checked" : "") + '><span class="' + (type === "radio" ? "radio" : "box") + '"></span><span>' + esc(label) + "</span></label>";
  }

  function siNo(name, value) {
    return '<div class="opts">' + optHtml("radio", name, "Si", value === "Si", "Si") + optHtml("radio", name, "No", value === "No", "No") + "</div>";
  }

  // Desplegable con casillas (multiple) o círculos (opción única).
  function dropdown(key, options, selected, multiple) {
    const open = !!ui.open[key];
    const val = selected.length ? selected.join("; ") : "";
    let h = '<div class="dd' + (open ? " open" : "") + '" data-dd="' + key + '">';
    h += '<button type="button" class="dd-head" data-toggle-dd="' + key + '"><span class="dd-value">' + esc(val) + "</span>" + (open ? ICON.up : ICON.down) + "</button>";
    if (open) {
      h += '<div class="dd-list">';
      options.forEach(o => { h += optHtml(multiple ? "checkbox" : "radio", "dd:" + key, o, selected.indexOf(o) >= 0, o); });
      h += "</div>";
    }
    return h + "</div>";
  }

  function mediaPhoto(key, dataUrl) {
    let h = '<div class="pill-group"><div class="pill">' +
      '<button type="button" data-photo="' + key + '" data-src="camera" aria-label="Sacar foto">' + ICON.camera + "</button>" +
      '<button type="button" data-photo="' + key + '" data-src="file" aria-label="Elegir archivo">' + ICON.folder + "</button></div></div>";
    if (dataUrl) {
      h += '<div class="media-preview"><img src="' + dataUrl + '" alt="Foto cargada"><br><button type="button" class="remove" data-remove="' + key + '">Quitar foto</button></div>';
    }
    return h;
  }

  function fieldErr(key) {
    return ui.errors[key] ? '<div class="err-msg">' + esc(ui.errors[key]) + "</div>" : "";
  }
  function inv(key) { return ui.errors[key] ? " invalid" : ""; }

  // ---------- Pantallas ----------
  function setChrome(opts) {
    $("#bottombar").hidden = !opts.bottom;
    $("#btnClose").style.visibility = opts.close ? "visible" : "hidden";
    $("#topTitle").textContent = opts.title || "Obras";
    if (opts.bottom) {
      $("#pageLabel").textContent = opts.label;
      $("#btnPrev").hidden = !opts.prev;
      $("#btnNext").hidden = false;
      $("#btnNext").innerHTML = opts.final ? ICON.check : ICON.next;
      $("#btnNext").setAttribute("aria-label", opts.final ? "Enviar acta" : "Página siguiente");
    }
  }

  function render(keepScroll) {
    const top = screen.scrollTop;
    if (view === "home") renderHome();
    else if (view === "form") state.page === 1 ? renderPage1() : renderPage2();
    else if (view === "summary") renderSummary();
    else if (view === "saved") renderSaved();
    screen.scrollTop = keepScroll ? top : 0;
  }

  function renderHome() {
    setChrome({ bottom: false, close: false });
    let h = '<div class="logo-box"><div class="logo-title">Obras</div><div class="logo-sub">Obras por Terceros</div><div class="sim-badge">SIMULADOR · datos ficticios</div></div>';
    h += '<div class="section-title">Elegí una obra para inspeccionar</div>';
    D.obras.forEach((o, i) => {
      h += '<button class="obra-card" data-obra="' + i + '"><div class="nro">' + esc(o.nroProyecto) + "</div>" +
        '<div class="meta">' + esc(o.localidad) + ", " + esc(o.provincia) + " · " + esc(o.contratista) + "</div>" +
        '<div class="meta">Tipo de obra ' + esc(o.tipoObra) + " · " + esc(o.presion) + " · " + esc(o.metrosPrevistos) + " m previstos</div></button>";
    });
    const n = loadSaved().length;
    h += '<button class="btn block" data-go="saved">Actas guardadas (' + n + ")</button>";
    h += '<p class="muted">Este simulador reproduce el formulario de la app para practicar y probar casos antes de comunicarlos. No envía nada a ningún sistema: las actas quedan solo en este navegador.</p>';
    screen.innerHTML = h;
  }

  function renderPage1() {
    const o = state.obra;
    setChrome({ bottom: true, close: true, label: "1 de 2", prev: false, final: false });
    let h = '<div class="logo-box"><div class="logo-title">Obras</div><div class="logo-sub">Obras por Terceros</div><div class="sim-badge">SIMULADOR</div></div>';
    h += '<div class="section-title" style="margin-top:0">Datos de la obra</div><div class="kv">';
    [["Nro Proyectos", o.nroProyecto], ["Provincia", o.provincia], ["Localidad", o.localidad], ["Tipo", o.tipo],
     ["Contratista", o.contratista], ["Tipo de Obra", o.tipoObra], ["Presion", o.presion], ["Metros Previstos", o.metrosPrevistos],
     ["Observaciones", o.observaciones]].forEach(p => { h += "<div><b>" + p[0] + ":</b> <span>" + esc(p[1]) + "</span></div>"; });
    h += "</div>";
    h += '<div class="section-title">Ubicación</div><div class="map-box"><div class="map-head">' + ICON.target +
      '<span class="coords">' + coordText({ lat: o.lat, lng: o.lng }) + "</span></div>" + mapSvg() + "</div>";
    h += '<div class="section-title">Foto actualizada de la obra</div>' + mediaPhoto("fotoObra", state.fotoObra);
    screen.innerHTML = h;
  }

  function renderPage2() {
    setChrome({ bottom: true, close: true, label: "2 de 2", prev: true, final: true });
    const s = state;
    let h = '<div class="form-title">Acta de Inspeccion digital</div>';

    // Ubicación
    h += '<div class="field"><label>Ubicación</label><div class="map-box"><div class="map-head">' +
      '<button type="button" data-act="locate" aria-label="Capturar ubicación">' + ICON.target + "</button>" +
      '<span class="coords">' + (s.ubicacion ? coordText(s.ubicacion) : '<span class="muted">Sin ubicación: tocá el ícono para capturar</span>') + "</span>" +
      (s.ubicacion ? '<button type="button" data-act="clearloc" aria-label="Borrar ubicación">' + ICON.xcircle + "</button>" : "") +
      "</div>" + (s.ubicacion ? mapSvg() : '<div class="map-empty">Sin ubicación</div>') + "</div></div>";

    h += '<div class="field inline-kv">Contratista: <span>' + esc(s.obra.contratista) + "</span></div>";
    h += '<div class="field"><label for="f-sub">Subcontratista</label><input class="input" id="f-sub" data-bind="subcontratista" value="' + esc(s.subcontratista) + '"></div>';

    h += '<div class="field"><div class="field-label">Material</div><div class="opts">' +
      D.materiales.map(m => optHtml("checkbox", "material", m, s.material.indexOf(m) >= 0, m)).join("") + "</div></div>";

    h += '<div class="field"><div class="field-label">Fase de ejecucion</div>' + dropdown("fase", D.fasesEjecucion, s.fase, true) + "</div>";

    h += '<div class="field' + inv("hito") + '" id="fld-hito"><div class="field-label">Hito <span class="req">*</span></div><div class="opts five">' +
      D.hitos.map(x => optHtml("checkbox", "hito", x, s.hito.indexOf(x) >= 0, x)).join("") + "</div>" + fieldErr("hito") + "</div>";

    h += '<div class="field' + inv("defecto") + '" id="fld-defecto"><div class="field-label">Defecto <span class="req">*</span></div>' + siNo("defecto", s.defecto) + fieldErr("defecto") + "</div>";

    if (s.defecto === "Si") {
      // Sección Defecto
      h += group("defecto", "Defecto", () => {
        let b = "";
        D.defectos.forEach(d => {
          const st = s.defectos[d.id];
          b += '<div class="field"><div class="field-label">' + esc(d.titulo) + "</div>" + siNo("def:" + d.id, st.tiene) + "</div>";
          if (st.tiene === "Si") {
            const k = "det:" + d.id;
            b += '<div class="field' + inv(k) + '" id="fld-' + d.id + '"><div class="field-label">' + esc(d.detalle) + ' <span class="req">*</span></div>' +
              dropdown(k, d.opciones, st.detalle, d.multiple) + fieldErr(k) + "</div>";
          }
        });
        return b;
      });
      // Sección Acción
      h += group("accion", "Accion", () =>
        '<div class="field' + inv("accion") + '" id="fld-accion"><div class="field-label">Defecto solucionado en día <span class="req">*</span></div>' +
        siNo("accion", s.accion.solucionadoEnDia) + fieldErr("accion") + "</div>" +
        '<div class="pending-note">Borrador: en las capturas solo se ve este campo de la sección Acción. Mandá capturas del resto para completarla.</div>');
      // Sección Orden de servicio
      h += group("orden", "Orden de servicio", () =>
        '<div class="pending-note">Borrador: faltan capturas de esta sección. Mientras tanto podés anotar lo que corresponda.</div>' +
        '<div class="field"><label for="f-os">Notas de la orden de servicio (provisorio)</label><textarea class="textarea" id="f-os" data-bind="ordenServicio.notas">' + esc(s.ordenServicio.notas) + "</textarea></div>");

      h += '<div class="field"><label for="f-desdef">Descripcion del defecto</label><textarea class="textarea" id="f-desdef" data-bind="descripcionDefecto">' + esc(s.descripcionDefecto) + "</textarea></div>";
    }

    h += '<div class="field"><label for="f-dni">DNI Soldador Fusionista</label><input class="input" id="f-dni" inputmode="numeric" data-bind="dniSoldador" value="' + esc(s.dniSoldador) + '"></div>';
    h += '<div class="field"><label for="f-jefe">Nombre de jefe de obra</label><input class="input" id="f-jefe" maxlength="255" data-bind="jefeObra" value="' + esc(s.jefeObra) + '"><div class="counter" data-counter="jefeObra">' + (255 - s.jefeObra.length) + "</div></div>";
    h += '<div class="field"><div class="field-label orange">Firma de jefe de obra</div>' + signBtn("firmaJefe") + "</div>";

    // Actividad (repetible)
    const a = s.actividades[s.actIdx];
    h += '<div class="field"><label for="f-act">Descripcion de la actividad</label><textarea class="textarea" id="f-act" data-bind="act.descripcion">' + esc(a.descripcion) + "</textarea></div>";
    h += group("registro", "Registro fotografico de la actividad", () => {
      let b = '<div class="field-label orange" style="margin-top:4px">Foto 1</div>' + mediaPhoto("act.foto", a.foto);
      b += '<div class="field-label orange" style="margin-top:18px">Audio</div><button type="button" class="round-btn" data-act="audio" aria-label="Grabar audio">' + ICON.mic + "</button>";
      if (a.audio) b += '<div class="media-preview"><audio controls src="' + a.audio + '"></audio><br><button type="button" class="remove" data-remove="act.audio">Quitar audio</button></div>';
      b += '<div class="field-label orange" style="margin-top:18px">Adjuntar video</div><button type="button" class="round-btn" data-act="video" aria-label="Adjuntar video">' + ICON.clip + "</button>";
      if (a.video) b += '<div class="media-preview"><span class="file-tag">🎬 ' + esc(a.video) + '</span><br><button type="button" class="remove" data-remove="act.video">Quitar video</button></div>';
      return b;
    });
    h += '<div class="field"><label for="f-av">Porcentaje de avance de Obra</label><input class="input" id="f-av" type="number" min="0" max="100" inputmode="numeric" placeholder="0 a 100" data-bind="act.avance" value="' + esc(a.avance) + '"></div>';
    h += '<div class="repeater"><button type="button" data-act="delact" aria-label="Borrar actividad">' + ICON.trash + "</button>" +
      '<div class="rep-label">' + (s.actividades.length > 1 ? '<button type="button" class="rep-nav" data-act="prevact" aria-label="Anterior">‹</button>' : "") +
      (s.actIdx + 1) + " de " + s.actividades.length +
      (s.actividades.length > 1 ? '<button type="button" class="rep-nav" data-act="nextact" aria-label="Siguiente">›</button>' : "") + "</div>" +
      '<button type="button" data-act="addact" aria-label="Agregar actividad">' + ICON.plus + "</button></div>";

    screen.innerHTML = h;
  }

  function group(key, title, bodyFn) {
    const open = ui.groups[key];
    return '<div class="group' + (open ? " open" : "") + '"><button type="button" class="group-head" data-group="' + key + '"><span class="tri"></span>' + esc(title) + "</button>" +
      (open ? '<div class="group-body">' + bodyFn() + "</div>" : "") + "</div>";
  }

  function signBtn(key) {
    let h = '<button type="button" class="round-btn" data-sign="' + key + '" aria-label="Firmar">' + ICON.sign + "</button>";
    if (state[key]) h += '<div class="media-preview sig-preview"><img src="' + state[key] + '" alt="Firma"><br><button type="button" class="remove" data-remove="' + key + '">Borrar firma</button></div>';
    return h;
  }

  // ---------- Validación ----------
  function validate() {
    const e = {};
    const s = state;
    if (!s.hito.length) e.hito = "Elegí al menos un hito.";
    if (s.defecto !== "Si" && s.defecto !== "No") e.defecto = "Indicá si hay defecto.";
    if (s.defecto === "Si") {
      let alguno = false;
      D.defectos.forEach(d => {
        const st = s.defectos[d.id];
        if (st.tiene === "Si") {
          alguno = true;
          if (!st.detalle.length) e["det:" + d.id] = "Elegí el detalle del defecto.";
        }
      });
      if (!alguno) e.defecto = "Marcaste Defecto: Si, pero ningún tipo de defecto está en Si.";
      if (!s.accion.solucionadoEnDia) e.accion = "Indicá si el defecto se solucionó en el día.";
    }
    const av = s.actividades.map(a => a.avance).filter(v => v !== "");
    if (av.some(v => isNaN(+v) || +v < 0 || +v > 100)) e.avance = "El avance tiene que ser un número de 0 a 100.";
    return e;
  }

  function submit() {
    const e = validate();
    ui.errors = e;
    if (Object.keys(e).length) {
      if (e["accion"]) ui.groups.accion = true;
      if (Object.keys(e).some(k => k.indexOf("det:") === 0)) ui.groups.defecto = true;
      render(true);
      const first = screen.querySelector(".invalid");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      toast(e.avance || "Faltan campos obligatorios (*)");
      return;
    }
    const acta = JSON.parse(JSON.stringify(state));
    delete acta.page; delete acta.actIdx;
    acta.id = "SIM-" + Date.now().toString(36).toUpperCase();
    acta.fecha = new Date().toISOString();
    const list = loadSaved();
    list.unshift(acta);
    if (!saveSaved(list)) toast("No se pudo guardar en el navegador");
    lastActa = acta;
    $("#toast").hidden = true;
    view = "summary";
    render();
  }

  // ---------- Resumen ----------
  let lastActa = null;

  function actaTexto(a) {
    const L = [];
    L.push("ACTA DE INSPECCIÓN DIGITAL (simulador)");
    L.push("Acta: " + a.id + " · " + new Date(a.fecha).toLocaleString("es-AR"));
    L.push("Obra: " + a.obra.nroProyecto + " · " + a.obra.localidad + ", " + a.obra.provincia);
    L.push("Contratista: " + a.obra.contratista + (a.subcontratista ? " · Subcontratista: " + a.subcontratista : ""));
    if (a.ubicacion) L.push("Ubicación: " + coordText(a.ubicacion));
    if (a.material.length) L.push("Material: " + a.material.join(", "));
    if (a.fase.length) L.push("Fase de ejecución: " + a.fase.join(", "));
    L.push("Hito: " + a.hito.join(", "));
    L.push("Defecto: " + a.defecto);
    if (a.defecto === "Si") {
      D.defectos.forEach(d => {
        const st = a.defectos[d.id];
        if (st.tiene === "Si") {
          L.push("  • " + d.titulo + ":");
          st.detalle.forEach(x => L.push("     - " + x));
        }
      });
      L.push("Defecto solucionado en día: " + a.accion.solucionadoEnDia);
      if (a.ordenServicio.notas) L.push("Orden de servicio (notas): " + a.ordenServicio.notas);
      if (a.descripcionDefecto) L.push("Descripción del defecto: " + a.descripcionDefecto);
    }
    if (a.dniSoldador) L.push("DNI soldador fusionista: " + a.dniSoldador);
    if (a.jefeObra) L.push("Jefe de obra: " + a.jefeObra + (a.firmaJefe ? " (firmado)" : " (sin firma)"));
    a.actividades.forEach((x, i) => {
      if (x.descripcion || x.avance !== "" || x.foto || x.audio || x.video) {
        const extra = [x.foto ? "foto" : "", x.audio ? "audio" : "", x.video ? "video" : ""].filter(Boolean).join(", ");
        L.push("Actividad " + (i + 1) + ": " + (x.descripcion || "(sin descripción)") +
          (x.avance !== "" ? " · Avance " + x.avance + "%" : "") + (extra ? " · Adjuntos: " + extra : ""));
      }
    });
    return L.join("\n");
  }

  function renderSummary() {
    setChrome({ bottom: false, close: true, title: "Obras" });
    const a = lastActa;
    let h = '<div class="summary"><h2>Acta generada</h2><div class="ok">✓ Validación OK · guardada en este navegador</div><pre>' + esc(actaTexto(a)) + "</pre>";
    if (a.fotoObra && a.fotoObra.indexOf("data:") === 0) h += '<div class="media-preview"><img src="' + a.fotoObra + '" alt="Foto de la obra"></div>';
    h += "</div>";
    h += '<button class="btn primary block" data-act="copy">Copiar resumen</button>';
    h += '<button class="btn block" data-act="json">Descargar acta (JSON)</button>';
    h += '<button class="btn block" data-act="again">Nueva inspección de la misma obra</button>';
    h += '<button class="btn block" data-go="home">Volver al inicio</button>';
    screen.innerHTML = h;
  }

  function renderSaved() {
    setChrome({ bottom: false, close: true, title: "Actas guardadas" });
    const list = loadSaved();
    let h = '<div class="section-title" style="margin-top:0">Actas guardadas (' + list.length + ")</div>";
    if (!list.length) h += '<p class="muted">Todavía no hay actas. Completá una inspección y tocá ✓.</p>';
    list.forEach((a, i) => {
      h += '<div class="saved-item"><div><b>' + esc(a.obra.nroProyecto) + "</b> · " + esc(a.id) +
        '<span class="tag ' + (a.defecto === "Si" ? "def" : "nodef") + '">' + (a.defecto === "Si" ? "Con defecto" : "Sin defecto") + "</span></div>" +
        '<div class="when">' + esc(new Date(a.fecha).toLocaleString("es-AR")) + "</div>" +
        '<button class="btn" style="margin-top:8px" data-view-saved="' + i + '">Ver</button> ' +
        '<button class="btn danger" style="margin-top:8px" data-del-saved="' + i + '">Borrar</button></div>';
    });
    h += '<button class="btn block" data-go="home">Volver al inicio</button>';
    screen.innerHTML = h;
  }

  // ---------- Modales ----------
  function openModal(html) { const m = $("#modal"); m.innerHTML = '<div class="modal-card">' + html + "</div>"; m.hidden = false; return m; }
  function closeModal() { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; }

  function confirmBox(msg, okText, onOk) {
    const m = openModal("<p>" + esc(msg) + '</p><div class="modal-actions"><button class="btn" data-m="no">Cancelar</button><button class="btn primary" data-m="ok">' + esc(okText) + "</button></div>");
    m.onclick = ev => {
      const b = ev.target.closest("[data-m]");
      if (!b) return;
      closeModal();
      if (b.dataset.m === "ok") onOk();
    };
  }

  function signatureModal(key) {
    const m = openModal('<h3>Firma</h3><canvas class="sig-canvas" id="sig"></canvas><div class="modal-actions">' +
      '<button class="btn" data-m="clear">Limpiar</button><button class="btn" data-m="no">Cancelar</button><button class="btn primary" data-m="ok">Guardar</button></div>');
    const cv = $("#sig");
    const r = cv.getBoundingClientRect();
    cv.width = r.width * 2; cv.height = r.height * 2;
    const ctx = cv.getContext("2d");
    ctx.scale(2, 2); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "#0b2a6b";
    let drawing = false, dirty = false;
    const pt = ev => { const b = cv.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
    cv.onpointerdown = ev => { drawing = true; dirty = true; cv.setPointerCapture(ev.pointerId); const p = pt(ev); ctx.beginPath(); ctx.moveTo(p[0], p[1]); };
    cv.onpointermove = ev => { if (!drawing) return; const p = pt(ev); ctx.lineTo(p[0], p[1]); ctx.stroke(); };
    cv.onpointerup = () => { drawing = false; };
    m.onclick = ev => {
      const b = ev.target.closest("[data-m]");
      if (!b) return;
      if (b.dataset.m === "clear") { ctx.clearRect(0, 0, cv.width, cv.height); dirty = false; return; }
      if (b.dataset.m === "ok") {
        if (!dirty) { toast("Firmá en el recuadro"); return; }
        state[key] = cv.toDataURL("image/png");
      }
      closeModal();
      render(true);
    };
  }

  function audioModal() {
    const a = state.actividades[state.actIdx];
    const canRec = !!(navigator.mediaDevices && window.MediaRecorder);
    const m = openModal('<h3>Audio</h3><p class="muted" id="recStatus">' + (canRec ? "Tocá Grabar para empezar." : "Este navegador no permite grabar: elegí un archivo de audio.") + "</p>" +
      '<div class="modal-actions">' + (canRec ? '<button class="btn primary" data-m="rec">Grabar</button>' : "") +
      '<button class="btn" data-m="file">Elegir archivo</button><button class="btn" data-m="no">Cerrar</button></div>');
    let rec = null, chunks = [];
    m.onclick = async ev => {
      const b = ev.target.closest("[data-m]");
      if (!b) return;
      if (b.dataset.m === "no") { if (rec && rec.state === "recording") rec.stop(); closeModal(); return; }
      if (b.dataset.m === "file") {
        const f = await pickFile("audio/*");
        if (f) { a.audio = await fileToDataUrl(f); closeModal(); render(true); }
        return;
      }
      if (b.dataset.m === "rec") {
        if (rec && rec.state === "recording") { rec.stop(); return; }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          rec = new MediaRecorder(stream); chunks = [];
          rec.ondataavailable = e => chunks.push(e.data);
          rec.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            a.audio = await fileToDataUrl(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
            closeModal(); render(true);
          };
          rec.start();
          b.textContent = "Detener";
          $("#recStatus").textContent = "● Grabando...";
        } catch (e) { $("#recStatus").textContent = "No se pudo acceder al micrófono."; }
      }
    };
  }

  function fileToDataUrl(blob) {
    return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
  }

  function aboutModal() {
    const m = openModal("<h3>Acerca del simulador</h3><p>Reproduce las pantallas de la app de inspección de Obras por Terceros (Datos de la obra y Acta de Inspección digital) para practicar y probar casos antes de comunicar tareas.</p>" +
      "<p>Las obras son ficticias. Nada se envía a ningún sistema: las actas quedan en este navegador y se pueden copiar o descargar.</p>" +
      "<p class=\"muted\">Las secciones Acción y Orden de servicio están en borrador hasta tener sus capturas. Las listas se editan en <code>data.js</code>.</p>" +
      '<div class="modal-actions"><button class="btn primary" data-m="ok">Cerrar</button></div>');
    m.onclick = ev => { if (ev.target.closest("[data-m]")) closeModal(); };
  }

  // ---------- Acciones ----------
  function startObra(i) {
    state = nuevaActa(D.obras[i]);
    ui = nuevaUI();
    view = "form";
    render();
  }

  function loadDemo() {
    state = nuevaActa(D.obras[0]);
    ui = nuevaUI();
    state.page = 2;
    state.subcontratista = "Subcontratista de prueba";
    state.material = ["Polietileno"];
    state.fase = ["MECANICA", "PRUEBAS"];
    state.hito = ["2"];
    state.defecto = "Si";
    state.defectos.mecanico = { tiene: "Si", detalle: ["Uniones deficientes"] };
    state.defectos.seguridad = { tiene: "Si", detalle: ["Balizamiento", "Señalizacion"] };
    state.accion.solucionadoEnDia = "No";
    state.descripcionDefecto = "Fusión sin registrar y zanja sin balizar en la esquina.";
    state.jefeObra = "Juan Pérez";
    state.actividades[0].descripcion = "Inspección de tendido";
    state.actividades[0].avance = "40";
    view = "form";
    render();
    toast("Ejemplo cargado: revisalo y tocá ✓");
  }

  function getBind(path) {
    if (path.indexOf("act.") === 0) return [state.actividades[state.actIdx], path.slice(4)];
    const parts = path.split(".");
    let obj = state;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    return [obj, parts[parts.length - 1]];
  }

  function toggleIn(arr, v, on) {
    const i = arr.indexOf(v);
    if (on && i < 0) arr.push(v);
    if (!on && i >= 0) arr.splice(i, 1);
  }

  async function handlePhoto(key, src) {
    const f = await pickFile("image/*", src === "camera" ? "environment" : null);
    if (!f) return;
    try {
      const url = await readImage(f);
      const b = getBind(key);
      b[0][b[1]] = url;
      render(true);
    } catch (e) { toast("No se pudo leer la imagen"); }
  }

  function locate() {
    const btn = $("#btnGps");
    btn.classList.add("flash");
    setTimeout(() => btn.classList.remove("flash"), 900);
    const fallback = () => {
      // Sin GPS: usa la ubicación de la obra con un pequeño desvío.
      state.ubicacion = { lat: state.obra.lat + (Math.random() - .5) * 0.002, lng: state.obra.lng + (Math.random() - .5) * 0.002 };
      render(true);
      toast("Ubicación simulada cerca de la obra");
    };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      p => { state.ubicacion = { lat: p.coords.latitude, lng: p.coords.longitude }; render(true); toast("Ubicación capturada por GPS"); },
      fallback, { timeout: 6000 });
  }

  function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  // Clicks
  document.addEventListener("click", ev => {
    const t = ev.target;
    const menu = $("#menu");
    if (!t.closest("#menu") && !t.closest("#btnMenu")) menu.hidden = true;

    let el;
    if ((el = t.closest("#btnMenu"))) { menu.hidden = !menu.hidden; return; }
    if ((el = t.closest("[data-menu]"))) {
      menu.hidden = true;
      const k = el.dataset.menu;
      const go = fn => (view === "form" ? confirmBox("Se va a descartar el acta en curso.", "Continuar", fn) : fn());
      if (k === "home") go(() => { view = "home"; render(); });
      if (k === "saved") go(() => { view = "saved"; render(); });
      if (k === "demo") go(loadDemo);
      if (k === "reset") confirmBox("¿Borrar todas las actas guardadas en este navegador?", "Borrar", () => { saveSaved([]); toast("Actas borradas"); render(); });
      if (k === "about") aboutModal();
      return;
    }
    if ((el = t.closest("#btnClose"))) {
      if (view === "form") confirmBox("¿Salir sin guardar el acta?", "Salir", () => { view = "home"; render(); });
      else { view = "home"; render(); }
      return;
    }
    if ((el = t.closest("#btnGps"))) {
      if (view === "form") locate();
      else toast("El GPS se usa dentro de una inspección");
      return;
    }
    if ((el = t.closest("#btnNext"))) {
      if (state.page === 1) { state.page = 2; render(); } else submit();
      return;
    }
    if ((el = t.closest("#btnPrev"))) { state.page = 1; render(); return; }

    if ((el = t.closest("[data-obra]"))) { startObra(+el.dataset.obra); return; }
    if ((el = t.closest("[data-go]"))) { view = el.dataset.go; render(); return; }
    if ((el = t.closest("[data-toggle-dd]"))) {
      const k = el.dataset.toggleDd;
      ui.open[k] = !ui.open[k];
      render(true);
      return;
    }
    if ((el = t.closest("[data-group]"))) { const k = el.dataset.group; ui.groups[k] = !ui.groups[k]; render(true); return; }
    if ((el = t.closest("[data-photo]"))) { handlePhoto(el.dataset.photo, el.dataset.src); return; }
    if ((el = t.closest("[data-sign]"))) { signatureModal(el.dataset.sign); return; }
    if ((el = t.closest("[data-remove]"))) { const b = getBind(el.dataset.remove); b[0][b[1]] = null; render(true); return; }
    if ((el = t.closest("[data-view-saved]"))) { lastActa = loadSaved()[+el.dataset.viewSaved]; view = "summary"; render(); return; }
    if ((el = t.closest("[data-del-saved]"))) {
      const i = +el.dataset.delSaved;
      confirmBox("¿Borrar esta acta?", "Borrar", () => { const l = loadSaved(); l.splice(i, 1); saveSaved(l); render(); });
      return;
    }
    if ((el = t.closest("[data-act]"))) {
      const k = el.dataset.act;
      const s = state;
      if (k === "locate") locate();
      if (k === "clearloc") { s.ubicacion = null; render(true); }
      if (k === "audio") audioModal();
      if (k === "video") pickFile("video/*").then(f => { if (f) { s.actividades[s.actIdx].video = f.name; render(true); } });
      if (k === "addact") { s.actividades.push(nuevaActividad()); s.actIdx = s.actividades.length - 1; render(true); toast("Actividad " + (s.actIdx + 1) + " agregada"); }
      if (k === "delact") {
        if (s.actividades.length === 1) { s.actividades[0] = nuevaActividad(); toast("Actividad vaciada"); }
        else { s.actividades.splice(s.actIdx, 1); s.actIdx = Math.max(0, s.actIdx - 1); toast("Actividad borrada"); }
        render(true);
      }
      if (k === "prevact") { s.actIdx = (s.actIdx - 1 + s.actividades.length) % s.actividades.length; render(true); }
      if (k === "nextact") { s.actIdx = (s.actIdx + 1) % s.actividades.length; render(true); }
      if (k === "copy") {
        const txt = actaTexto(lastActa);
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("Resumen copiado"), () => {
          const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); toast("Resumen copiado"); } catch (e) { toast("No se pudo copiar"); }
          ta.remove();
        });
      }
      if (k === "json") download(lastActa.id + ".json", JSON.stringify(lastActa, null, 2));
      if (k === "again") {
        const i = D.obras.findIndex(o => o.nroProyecto === lastActa.obra.nroProyecto);
        startObra(i >= 0 ? i : 0);
      }
    }
  });

  // Cambios en casillas y círculos
  document.addEventListener("change", ev => {
    const t = ev.target;
    if (!state || !t.name) return;
    const s = state;
    const n = t.name;
    if (n === "material") toggleIn(s.material, t.value, t.checked);
    else if (n === "hito") { toggleIn(s.hito, t.value, t.checked); delete ui.errors.hito; }
    else if (n === "defecto") {
      s.defecto = t.value; delete ui.errors.defecto;
      if (t.value === "No") Object.keys(ui.errors).forEach(k => { if (k.indexOf("det:") === 0 || k === "accion") delete ui.errors[k]; });
    }
    else if (n === "accion") { s.accion.solucionadoEnDia = t.value; delete ui.errors.accion; }
    else if (n.indexOf("def:") === 0) {
      const id = n.slice(4);
      s.defectos[id].tiene = t.value;
      if (t.value === "No") { s.defectos[id].detalle = []; delete ui.errors["det:" + id]; }
      else ui.open["det:" + id] = true;
      delete ui.errors.defecto;
    }
    else if (n.indexOf("dd:") === 0) {
      const key = n.slice(3);
      if (key === "fase") toggleIn(s.fase, t.value, t.checked);
      else {
        const id = key.slice(4);
        const def = D.defectos.find(d => d.id === id);
        if (def.multiple) toggleIn(s.defectos[id].detalle, t.value, t.checked);
        else { s.defectos[id].detalle = [t.value]; ui.open[key] = false; }
        delete ui.errors[key];
      }
    }
    else return;
    render(true);
  });

  // Textos
  document.addEventListener("input", ev => {
    const t = ev.target;
    if (!t.dataset || !t.dataset.bind || !state) return;
    const b = getBind(t.dataset.bind);
    b[0][b[1]] = t.value;
    const c = document.querySelector('[data-counter="' + t.dataset.bind + '"]');
    if (c) c.textContent = 255 - t.value.length;
  });

  render();
})();
