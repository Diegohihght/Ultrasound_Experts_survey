(function () {
  "use strict";

  const CFG = SURVEY_CONFIG;
  const root = document.getElementById("app-root");

  // -- app state --

  const state = {
    step: 0,                 // 0 = welcome, 1 = info, 2 = global ranking, 3 = review, 4 = thanks
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

  // -- progress bar --

  function progressPct() {
    if (state.step <= 0) return 0;
    if (state.step >= STEP_THANKS) return 100;
    return Math.round((state.step / STEP_REVIEW) * 100);
  }

  function progressLabel() {
    if (state.step === 0) return "Welcome";
    if (state.step === STEP_INFO) return "Your background";
    if (state.step === STEP_RANKING) return "Global Algorithm Ranking";
    if (state.step === STEP_REVIEW) return "Review";
    return "Done";
  }

  // -- rendering --

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
      <h1>Which segmentation algorithm is most accurate overall?</h1>
      <p class="subtitle">
        Seven automated methods processed the full set of ultrasound images.
        In this global evaluation, we're asking experts to rank the 7 algorithms
        by their overall performance across all samples.
      </p>
      <a class="welcome-video" href="${CFG.VIDEO_TUTORIAL_URL}" target="_blank" rel="noopener">
        &#9654;&nbsp; Watch the tutorial before you start
      </a>
      <ul class="fact-list">
        <li><span class="dot"></span> Takes about 3&ndash;5 minutes, on a single ranking screen.</li>
        <li><span class="dot"></span> You'll order the 7 anonymous options from best to worst overall performance.</li>
        <li><span class="dot"></span> Tap any thumbnail to zoom in before deciding.</li>
        <li><span class="dot"></span> Your progress isn't saved until you submit the form at the end.</li>
      </ul>
      <div class="btn-row">
        <button class="btn btn-primary" id="btn-start">Start</button>
      </div>
    `;
    card.querySelector("#btn-start").onclick = () => { state.step = STEP_INFO; render(); };
  }

  function renderInfo(card) {
    const i = state.info;
    card.innerHTML = `
      <div class="eyebrow">Before you begin</div>
      <h2>Professional background</h2>
      <p class="subtitle">Used only to describe the panel as a whole &mdash; never linked to you individually.</p>

      <div class="field">
        <label for="f-exp">Years of clinical / research experience</label>
        <input type="number" id="f-exp" min="0" max="60" placeholder="e.g. 7" value="${i.experience}">
      </div>

      <div class="field">
        <label>Degree / professional level</label>
        <div class="radio-grid" id="f-degree"></div>
      </div>

      <div class="field">
        <label for="f-spec">Specialty</label>
        <input type="text" id="f-spec" placeholder="e.g. Orthopedic surgery" value="${i.specialty}">
      </div>

      <div class="field">
        <label for="f-inst">Institution / affiliation</label>
        <input type="text" id="f-inst" placeholder="e.g. Hospital / University" value="${i.institution}">
      </div>

      <div class="field">
        <label for="f-email">Email <span class="hint">(optional)</span></label>
        <input type="email" id="f-email" placeholder="you@hospital.org" value="${i.email}">
      </div>

      <div id="info-error"></div>
      <div class="btn-row">
        <button class="btn btn-secondary" id="btn-back">Back</button>
        <button class="btn btn-primary" id="btn-next">Continue</button>
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
          `<div class="error-banner">Please fill in years of experience, degree, and specialty.</div>`;
        return;
      }
      state.step = STEP_RANKING;
      render();
    };
  }

  function renderGlobalRankingStep(card) {
    const entry = ensureGlobalRankingState();

    card.innerHTML = `
      <div class="eyebrow">Global evaluation</div>
      <h2>Rank the 7 algorithms from best to worst overall</h2>
      <p class="subtitle">Consider each algorithm's overall performance across all samples. Drag the options, or use the arrows.</p>
    `;

    const refRow = document.createElement("div");
    refRow.className = "ref-row";
    [
      ["original", "Original reference image and expert segmentations"],
      ["majority_vote", "Expert majority vote"],
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
    instr.textContent = "1 = best algorithm overall · 7 = worst algorithm overall";
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
        const img = imgWithFallback(imageSrc(GLOBAL_IMAGE_ID, algoId), `Option ${entry.letters[algoId]}`);
        thumbWrap.appendChild(img);
        thumbWrap.onclick = () => openLightbox(img.src);
        li.appendChild(thumbWrap);

        const name = document.createElement("div");
        name.className = "rank-name";
        name.textContent = `Option ${entry.letters[algoId]}`;
        li.appendChild(name);

        const controls = document.createElement("div");
        controls.className = "rank-controls";

        const upBtn = document.createElement("button");
        upBtn.className = "icon-btn";
        upBtn.type = "button";
        upBtn.innerHTML = "&#8593;";
        upBtn.setAttribute("aria-label", "Move up");
        upBtn.disabled = idx === 0;
        upBtn.onclick = () => { moveItem(idx, idx - 1); };

        const downBtn = document.createElement("button");
        downBtn.className = "icon-btn";
        downBtn.type = "button";
        downBtn.innerHTML = "&#8595;";
        downBtn.setAttribute("aria-label", "Move down");
        downBtn.disabled = idx === entry.order.length - 1;
        downBtn.onclick = () => { moveItem(idx, idx + 1); };

        controls.appendChild(upBtn);
        controls.appendChild(downBtn);
        li.appendChild(controls);

        li.addEventListener("dragstart", () => { li.classList.add("dragging"); });
        li.addEventListener("dragend", () => {
          li.classList.remove("dragging");
          // If drop() already handled the reorder, the list was rebuilt with
          // fresh nodes and nothing here still carries the dragging class --
          // repainting again would just cut the slide animation short.
          if (list.querySelector(".dragging")) paintList();
        });
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

      // FLIP: capture where every row currently sits, reorder + repaint,
      // then slide each row from its old spot into its new one instead of
      // just popping into place -- makes the reorder actually readable.
      const firstRects = new Map();
      Array.from(list.children).forEach(el => {
        firstRects.set(el.dataset.algoId, el.getBoundingClientRect());
      });

      const [moved] = entry.order.splice(fromIdx, 1);
      entry.order.splice(toIdx, 0, moved);
      paintList();

      Array.from(list.children).forEach(el => {
        const first = firstRects.get(el.dataset.algoId);
        if (!first) return;
        const last = el.getBoundingClientRect();
        const deltaY = first.top - last.top;
        if (!deltaY) return;
        el.style.transition = "none";
        el.style.transform = `translateY(${deltaY}px)`;
        requestAnimationFrame(() => {
          el.style.transition = "transform 320ms cubic-bezier(.22,.8,.28,1)";
          el.style.transform = "";
        });
      });
    }

    paintList();

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    btnRow.innerHTML = `
      <button class="btn btn-secondary" id="btn-back">Back</button>
      <button class="btn btn-primary" id="btn-next">Review answers</button>
    `;
    card.appendChild(btnRow);

    card.querySelector("#btn-back").onclick = () => { state.step = STEP_INFO; render(); };
    card.querySelector("#btn-next").onclick = () => { state.step = STEP_REVIEW; render(); };
  }

  function rankColor(idx, total) {
    const t = total <= 1 ? 0 : idx / (total - 1);
    const purple = [61, 18, 118];
    const wine = [126, 41, 84];
    const c = purple.map((v, i) => Math.round(v + (wine[i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function renderReview(card) {
    const i = state.info;
    card.innerHTML = `
      <div class="eyebrow">Almost done</div>
      <h2>Review before you submit</h2>
      <p class="subtitle">You can still go back and change your ranking.</p>
      <div class="summary-grid">
        <div class="summary-row"><span class="k">Experience</span><span class="v">${escapeHtml(i.experience)} years</span></div>
        <div class="summary-row"><span class="k">Degree</span><span class="v">${escapeHtml(i.degree)}</span></div>
        <div class="summary-row"><span class="k">Specialty</span><span class="v">${escapeHtml(i.specialty)}</span></div>
        <div class="summary-row"><span class="k">Institution</span><span class="v">${escapeHtml(i.institution || "\u2014")}</span></div>
        <div class="summary-row"><span class="k">Evaluation</span><span class="v">Global ranking completed</span></div>
      </div>
      <div id="submit-error"></div>
      <div class="btn-row">
        <button class="btn btn-secondary" id="btn-back">Back</button>
        <button class="btn btn-primary" id="btn-submit">${state.submitting ? "Submitting\u2026" : "Submit my ranking"}</button>
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
      <h2>Thank you! Your ranking has been recorded.</h2>
      <p class="subtitle">
        Your evaluation will help determine the most effective segmentation algorithm.
      </p>
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function openLightbox(src) {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = `<button class="close-x" aria-label="Close">&times;</button>`;
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
        throw new Error("The survey isn't configured yet (missing APPS_SCRIPT_URL).");
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
      state.submitError = "Couldn't connect to the server. Please try again.";
      renderReview(root.querySelector(".card"));
    }
  }

  render();
})();