(function () {
  "use strict";

  const CFG = SURVEY_CONFIG;
  const root = document.getElementById("app-root");

  // ---------------------------------------------------------------------
  // Estado de la Aplicación
  // ---------------------------------------------------------------------

  const state = {
    step: 0,                 // 0 = bienvenida, 1 = información, 2 = ranking global, 3 = revisión, 4 = gracias
    info: { experience: "", degree: "", specialty: "", institution: "", email: "" },
    globalRanking: null,     // { letters: {algoId: 'A'}, order: [algoId,...] }
    submitting: false,
    submitError: null,
  };

  const STEP_INFO = 1;
  const STEP_RANKING = 2;
  const STEP_REVIEW = 3;
  const STEP_THANKS = 4;

  const GLOBAL_IMAGE_ID = CFG.GLOBAL_CASE_ID || "2";

  function letterFor(i) { return String.fromCharCode(65 + i); }

  function ensureGlobalRankingState() {
    if (state.globalRanking) return state.globalRanking;
    const algoIds = CFG.ALGORITHMS.map(a => a.id);
    const shuffled = [...algoIds].sort(() => Math.random() - 0.5);
    const letters = {};
    shuffled.forEach((id, i) => { letters[id] = letterFor(i); });
    const entry = { letters, order: shuffled };
    state.globalRanking = entry;
    return entry;
  }

  function imageSrc(imageId, fileBase) {
    return [`images/${imageId}/${fileBase}.jpg`,
            `images/${imageId}/${fileBase}.jpeg`,
            `images/${imageId}/${fileBase}.png`];
  }

  function imgWithFallback(candidates, alt, cls) {
    const img = document.createElement("img");
    img.alt = alt;
    if (cls) img.className = cls;
    let i = 0;
    img.src = candidates[i];
    img.onerror = () => {
      i += 1;
      if (i < candidates.length) { img.src = candidates[i]; }
      else { img.onerror = null; img.style.background = "#e6e6e6"; }
    };
    return img;
  }

  // ---------------------------------------------------------------------
  // Barra de Progreso
  // ---------------------------------------------------------------------

  function progressPct() {
    if (state.step <= 0) return 0;
    if (state.step >= STEP_THANKS) return 100;
    return Math.round((state.step / STEP_REVIEW) * 100);
  }

  function progressLabel() {
    if (state.step === 0) return "Bienvenido";
    if (state.step === STEP_INFO) return "Su experiencia";
    if (state.step === STEP_RANKING) return "Ranking Global de Algoritmos";
    if (state.step === STEP_REVIEW) return "Revisión";
    return "Completado";
  }

  // ---------------------------------------------------------------------
  // Renderizado
  // ---------------------------------------------------------------------

  function render() {
    root.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "progress-wrap";
    wrap.innerHTML = `
      <div class="progress-label">
        <span>${progressLabel()}</span>
        <span>${progressPct()}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progressPct()}%"></div></div>
    `;
    root.appendChild(wrap);

    const card = document.createElement("div");
    card.className = "card";
    root.appendChild(card);

    if (state.step === 0) renderWelcome(card);
    else if (state.step === STEP_INFO) renderInfo(card);
    else if (state.step === STEP_RANKING) renderGlobalRankingStep(card);
    else if (state.step === STEP_REVIEW) renderReview(card);
    else renderThanks(card);

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function renderWelcome(card) {
    card.innerHTML = `
      <div class="eyebrow">WESTLAB / Mitacs &mdash; Bone &amp; Callus Segmentation</div>
      <h1>¿Qué algoritmo de segmentación es más preciso en general?</h1>
      <p class="subtitle">
        Siete métodos automatizados han procesado el conjunto de imágenes de ultrasonido.
        En esta evaluación global, pedimos a expertos que ordenen los 7 algoritmos
        según su desempeño general considerando todas las muestras.
      </p>
      <a class="welcome-video" href="${CFG.VIDEO_TUTORIAL_URL}" target="_blank" rel="noopener">
        &#9654;&nbsp; Ver el tutorial antes de comenzar
      </a>
      <ul class="fact-list">
        <li><span class="dot"></span> Toma aproximadamente 3&ndash;5 minutos en una sola pantalla de ranking.</li>
        <li><span class="dot"></span> Ordenará las 7 opciones anónimas de mejor a peor desempeño global.</li>
        <li><span class="dot"></span> Puede presionar cualquier miniatura para hacer zoom antes de decidir.</li>
        <li><span class="dot"></span> Su progreso no se guarda hasta enviar el formulario al final.</li>
      </ul>
      <div class="btn-row">
        <button class="btn btn-primary" id="btn-start">Comenzar</button>
      </div>
    `;
    card.querySelector("#btn-start").onclick = () => { state.step = STEP_INFO; render(); };
  }

  function renderInfo(card) {
    const i = state.info;
    card.innerHTML = `
      <div class="eyebrow">Antes de comenzar</div>
      <h2>Información profesional</h2>
      <p class="subtitle">Se utiliza únicamente para describir al panel en conjunto &mdash; nunca se vincula individualmente.</p>

      <div class="field">
        <label for="f-exp">Años de experiencia clínica / investigación</label>
        <input type="number" id="f-exp" min="0" max="60" placeholder="e.g. 7" value="${i.experience}">
      </div>

      <div class="field">
        <label>Grado / Nivel profesional</label>
        <div class="radio-grid" id="f-degree"></div>
      </div>

      <div class="field">
        <label for="f-spec">Especialidad</label>
        <input type="text" id="f-spec" placeholder="e.g. Cirugía ortopédica" value="${i.specialty}">
      </div>

      <div class="field">
        <label for="f-inst">Institución / Afiliación</label>
        <input type="text" id="f-inst" placeholder="e.g. Hospital / Universidad" value="${i.institution}">
      </div>

      <div class="field">
        <label for="f-email">Correo electrónico <span class="hint">(opcional)</span></label>
        <input type="email" id="f-email" placeholder="usted@hospital.org" value="${i.email}">
      </div>

      <div id="info-error"></div>
      <div class="btn-row">
        <button class="btn btn-secondary" id="btn-back">Atrás</button>
        <button class="btn btn-primary" id="btn-next">Continuar</button>
      </div>
    `;

    const degreeGrid = card.querySelector("#f-degree");
    CFG.DEGREE_OPTIONS.forEach(opt => {
      const pill = document.createElement("label");
      pill.className = "radio-pill" + (i.degree === opt ? " checked" : "");
      pill.innerHTML = `<input type="radio" name="degree" value="${opt}"> ${opt}`;
      pill.querySelector("input").checked = i.degree === opt;
      pill.onclick = () => {
        i.degree = opt;
        degreeGrid.querySelectorAll(".radio-pill").forEach(p => p.classList.remove("checked"));
        pill.classList.add("checked");
      };
      degreeGrid.appendChild(pill);
    });

    card.querySelector("#f-exp").oninput = e => { i.experience = e.target.value; };
    card.querySelector("#f-spec").oninput = e => { i.specialty = e.target.value; };
    card.querySelector("#f-inst").oninput = e => { i.institution = e.target.value; };
    card.querySelector("#f-email").oninput = e => { i.email = e.target.value; };

    card.querySelector("#btn-back").onclick = () => { state.step = 0; render(); };
    card.querySelector("#btn-next").onclick = () => {
      if (!i.experience || !i.degree || !i.specialty.trim()) {
        card.querySelector("#info-error").innerHTML =
          `<div class="error-banner">Por favor complete los años de experiencia, grado y especialidad.</div>`;
        return;
      }
      state.step = STEP_RANKING;
      render();
    };
  }

  function renderGlobalRankingStep(card) {
    const entry = ensureGlobalRankingState();

    card.innerHTML = `
      <div class="eyebrow">Evaluación Global</div>
      <h2>Ordene los 7 algoritmos de mejor a peor en general</h2>
      <p class="subtitle">Considere el rendimiento general de cada algoritmo a través de todas las muestras. Arrastre las opciones o use las flechas.</p>
    `;

    const refRow = document.createElement("div");
    refRow.className = "ref-row";
    [
      ["original", "Imagen original de referencia y segmentaciones de expertos"],
      ["majority_vote", "Voto mayoritario de expertos"],
      ["staple", "STAPLE"],
    ].forEach(([file, cap]) => {
      const thumb = document.createElement("div");
      thumb.className = "ref-thumb";
      const img = imgWithFallback(imageSrc(GLOBAL_IMAGE_ID, file), cap);
      thumb.appendChild(img);
      const capEl = document.createElement("div");
      capEl.className = "cap";
      capEl.textContent = cap;
      thumb.appendChild(capEl);
      thumb.onclick = () => openLightbox(img.src);
      refRow.appendChild(thumb);
    });
    card.appendChild(refRow);

    const instr = document.createElement("p");
    instr.className = "rank-instructions";
    instr.textContent = "1 = Mejor algoritmo en general · 7 = Peor algoritmo en general";
    card.appendChild(instr);

    const list = document.createElement("ul");
    list.className = "rank-list";
    card.appendChild(list);

    function paintList() {
      list.innerHTML = "";
      entry.order.forEach((algoId, idx) => {
        const li = document.createElement("li");
        li.className = "rank-item";
        li.draggable = true;
        li.dataset.algoId = algoId;

        const badge = document.createElement("div");
        badge.className = "rank-badge";
        badge.style.background = rankColor(idx, entry.order.length);
        badge.textContent = String(idx + 1);
        li.appendChild(badge);

        const handle = document.createElement("span");
        handle.className = "drag-handle";
        handle.setAttribute("aria-hidden", "true");
        handle.textContent = "\u22ee\u22ee";
        li.appendChild(handle);

        const thumbWrap = document.createElement("div");
        thumbWrap.className = "rank-thumb";
        const img = imgWithFallback(imageSrc(GLOBAL_IMAGE_ID, algoId), `Opción ${entry.letters[algoId]}`);
        thumbWrap.appendChild(img);
        thumbWrap.onclick = () => openLightbox(img.src);
        li.appendChild(thumbWrap);

        const name = document.createElement("div");
        name.className = "rank-name";
        name.textContent = `Opción ${entry.letters[algoId]}`;
        li.appendChild(name);

        const controls = document.createElement("div");
        controls.className = "rank-controls";

        const upBtn = document.createElement("button");
        upBtn.className = "icon-btn";
        upBtn.type = "button";
        upBtn.innerHTML = "&#8593;";
        upBtn.setAttribute("aria-label", "Mover arriba");
        upBtn.disabled = idx === 0;
        upBtn.onclick = () => { moveItem(idx, idx - 1); };

        const downBtn = document.createElement("button");
        downBtn.className = "icon-btn";
        downBtn.type = "button";
        downBtn.innerHTML = "&#8595;";
        downBtn.setAttribute("aria-label", "Mover abajo");
        downBtn.disabled = idx === entry.order.length - 1;
        downBtn.onclick = () => { moveItem(idx, idx + 1); };

        controls.appendChild(upBtn);
        controls.appendChild(downBtn);
        li.appendChild(controls);

        li.addEventListener("dragstart", () => { li.classList.add("dragging"); });
        li.addEventListener("dragend", () => { li.classList.remove("dragging"); paintList(); });
        li.addEventListener("dragover", (e) => {
          e.preventDefault();
          li.classList.add("drag-over");
        });
        li.addEventListener("dragleave", () => li.classList.remove("drag-over"));
        li.addEventListener("drop", (e) => {
          e.preventDefault();
          li.classList.remove("drag-over");
          const draggingEl = list.querySelector(".dragging");
          if (!draggingEl || draggingEl === li) return;
          const fromId = draggingEl.dataset.algoId;
          const toId = li.dataset.algoId;
          const fromIdx = entry.order.indexOf(fromId);
          const toIdx = entry.order.indexOf(toId);
          moveItem(fromIdx, toIdx);
        });

        list.appendChild(li);
      });
    }

    function moveItem(fromIdx, toIdx) {
      if (toIdx < 0 || toIdx >= entry.order.length) return;
      const [moved] = entry.order.splice(fromIdx, 1);
      entry.order.splice(toIdx, 0, moved);
      paintList();
    }

    paintList();

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    btnRow.innerHTML = `
      <button class="btn btn-secondary" id="btn-back">Atrás</button>
      <button class="btn btn-primary" id="btn-next">Revisar respuestas</button>
    `;
    card.appendChild(btnRow);

    card.querySelector("#btn-back").onclick = () => { state.step = STEP_INFO; render(); };
    card.querySelector("#btn-next").onclick = () => { state.step = STEP_REVIEW; render(); };
  }

  function rankColor(idx, total) {
    const t = total <= 1 ? 0 : idx / (total - 1);
    const teal = [47, 107, 98];
    const wine = [126, 41, 84];
    const c = teal.map((v, i) => Math.round(v + (wine[i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function renderReview(card) {
    const i = state.info;
    card.innerHTML = `
      <div class="eyebrow">Casi listo</div>
      <h2>Revise antes de enviar</h2>
      <p class="subtitle">Aún puede regresar y realizar cambios en su orden de selección.</p>
      <div class="summary-grid">
        <div class="summary-row"><span class="k">Experiencia</span><span class="v">${escapeHtml(i.experience)} años</span></div>
        <div class="summary-row"><span class="k">Grado</span><span class="v">${escapeHtml(i.degree)}</span></div>
        <div class="summary-row"><span class="k">Especialidad</span><span class="v">${escapeHtml(i.specialty)}</span></div>
        <div class="summary-row"><span class="k">Institución</span><span class="v">${escapeHtml(i.institution || "\u2014")}</span></div>
        <div class="summary-row"><span class="k">Evaluación</span><span class="v">Ranking Global Completado</span></div>
      </div>
      <div id="submit-error"></div>
      <div class="btn-row">
        <button class="btn btn-secondary" id="btn-back">Atrás</button>
        <button class="btn btn-primary" id="btn-submit">${state.submitting ? "Enviando\u2026" : "Enviar mi ranking"}</button>
      </div>
    `;
    card.querySelector("#btn-back").onclick = () => { state.step = STEP_RANKING; render(); };
    card.querySelector("#btn-submit").onclick = submit;

    if (state.submitError) {
      card.querySelector("#submit-error").innerHTML =
        `<div class="error-banner">${escapeHtml(state.submitError)}</div>`;
    }
  }

  function renderThanks(card) {
    card.innerHTML = `
      <div class="thanks-icon">&#10003;</div>
      <h2>¡Gracias! Su ranking ha sido registrado.</h2>
      <p class="subtitle">
        Su evaluación servirá para determinar el algoritmo de segmentación más efectivo.
      </p>
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function openLightbox(src) {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = `<button class="close-x" aria-label="Cerrar">&times;</button>`;
    const img = document.createElement("img");
    img.src = src;
    box.appendChild(img);
    box.onclick = (e) => { if (e.target === box || e.target.classList.contains("close-x")) box.remove(); };
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { box.remove(); document.removeEventListener("keydown", esc); }
    });
    document.body.appendChild(box);
  }

  function buildPayload() {
    return {
      submitted_at: new Date().toISOString(),
      experience_years: state.info.experience,
      degree: state.info.degree,
      specialty: state.info.specialty,
      institution: state.info.institution,
      email: state.info.email,
      responses: [
        {
          image_id: "global",
          ranking: state.globalRanking ? state.globalRanking.order : [],
        }
      ],
    };
  }

  async function submit() {
    if (state.submitting) return;
    state.submitting = true;
    state.submitError = null;
    render();

    const payload = buildPayload();

    try {
      if (!CFG.APPS_SCRIPT_URL || CFG.APPS_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
        throw new Error("El sistema no está configurado (falta APPS_SCRIPT_URL).");
      }
      await fetch(CFG.APPS_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      state.submitting = false;
      state.step = STEP_THANKS;
      render();
    } catch (err) {
      state.submitting = false;
      state.submitError = "No se pudo conectar con el servidor. Intente nuevamente.";
      renderReview(root.querySelector(".card"));
    }
  }

  render();
})();