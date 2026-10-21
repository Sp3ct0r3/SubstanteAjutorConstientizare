/* Minte Clară: logica aplicației (JavaScript simplu, fără dependențe externe).
   Toate datele vin din fișierele din /data. Textele utilizatorilor sunt escapate înainte de afișare. */
(function () {
  "use strict";

  const SITE = window.MC_SITE;
  const SUBS = window.MC_SUBSTANCES || [];
  const STUDIES = window.MC_STUDIES || [];
  const SERVICES = (window.MC_SERVICES || []).filter((s) => s && s.verificat === true);
  const SERVICE_TYPES = window.MC_SERVICE_TYPES || [];
  const OFFICIAL = window.MC_OFFICIAL_SOURCES || [];
  const QUIZZES = window.MC_QUIZZES || [];

  const app = document.getElementById("app");
  const loader = document.querySelector(".loader");

  /* ---------- Utilitare ---------- */
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) =>
    String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const uniq = (arr) => [...new Set(arr.filter((v) => v !== null && v !== undefined && v !== ""))].sort((a, b) =>
    String(a).localeCompare(String(b), "ro")
  );
  const fmtDate = (iso) => {
    if (!iso) return "neconfirmată";
    const d = new Date(iso + "T00:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString("ro-RO");
  };
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback; // stocarea poate fi indisponibilă (mod privat, setări de browser)
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    del(key) {
      try { localStorage.removeItem(key); } catch (e) { /* ignorat */ }
    }
  };

  const tipBadge = (tip) => {
    const t = norm(tip);
    if (t.includes("sintez")) return `<span class="badge">${esc(tip)}</span>`;
    if (t.includes("baza de date") || t.includes("cautare")) return `<span class="badge badge-warn">${esc(tip)}</span>`;
    return `<span class="badge">${esc(tip)}</span>`;
  };
  const verifBadge = (ok) =>
    ok
      ? `<span class="badge">Verificat</span>`
      : `<span class="badge badge-warn">Neverificat: confirmați înainte de citare</span>`;

  const urgencyKeywords = [
    "supradoz", "overdose", "nu respira", "respira greu", "nu raspunde", "pierdut constienta",
    "inconstient", "convulsi", "nu se trezeste", "infarct", "sinucid", "vreau sa mor", "ma omor",
    "dificultati de respiratie", "albastru la buze"
  ];

  /* ---------- Șablon de pagină ---------- */
  const callout112 = `
    <div class="alert alert-danger" role="note">
      <strong>Urgență reală?</strong>
      <p>${esc(SITE.urgenta.text)}</p>
      <a class="btn btn-emergency" href="tel:112">Sună 112</a>
    </div>`;

  /* ---------- Pagina principală ---------- */
  const heroSvg = `
    <svg viewBox="0 0 280 240" role="img" aria-label="Ilustrație simbolică: două persoane care discută">
      <circle cx="140" cy="120" r="108" fill="#e3f4f1"/>
      <path d="M60 182 Q95 146 130 182 Z" fill="#2c5282"/>
      <circle cx="95" cy="114" r="25" fill="#1e3a5f"/>
      <path d="M150 182 Q185 146 220 182 Z" fill="#2a9d8f"/>
      <circle cx="185" cy="114" r="25" fill="#2a9d8f"/>
      <rect x="120" y="44" width="72" height="38" rx="12" fill="#fff" stroke="#1e3a5f" stroke-width="2"/>
      <path d="M134 82 L128 94 L150 82 Z" fill="#fff" stroke="#1e3a5f" stroke-width="2"/>
      <circle cx="136" cy="63" r="4" fill="#1e3a5f"/><circle cx="156" cy="63" r="4" fill="#1e3a5f"/><circle cx="176" cy="63" r="4" fill="#1e3a5f"/>
    </svg>`;

  // Date pentru grafic: preluate din intrările din site.js (ue-cocaina-decese-2024).
  const COCAINE_CHART = {
    titlu: "Decese în care a fost implicată cocaina (20 de țări cu date pentru ambii ani)",
    serii: [
      { an: 2023, valoare: 1053, procent: 26 },
      { an: 2024, valoare: 1133, procent: 27 }
    ],
    sursaId: "ue-cocaina-decese-2024"
  };

  function statCard(s) {
    return `
      <article class="card">
        <div class="card-title">${esc(s.indicator)}</div>
        <div class="stat-value">${esc(s.valoare)}</div>
        <p class="stat-meta">
          <strong>Populație:</strong> ${esc(s.populatie)}<br/>
          <strong>Locație:</strong> ${esc(s.locatie)}<br/>
          <strong>An colectare date:</strong> ${s.anColectare ?? "—"} · <strong>An publicare:</strong> ${s.anPublicare ?? "—"}<br/>
          <strong>Sursă:</strong> ${esc(s.sursa)}
        </p>
        <p class="muted">${esc(s.nota)}</p>
        ${s.link ? `<p><a href="${esc(s.link)}" target="_blank" rel="noopener noreferrer">Raportul original (se deschide într-o filă nouă)</a></p>` : ""}
        ${s.verificat ? `<span class="badge">Sursă confirmată</span>` : `<span class="badge badge-warn">În curs de verificare</span>`}
      </article>`;
  }

  function cocaineChart() {
    const max = Math.max(...COCAINE_CHART.serii.map((x) => x.valoare));
    const src = (SITE.statistici || []).find((s) => s.id === COCAINE_CHART.sursaId);
    const rows = COCAINE_CHART.serii.map((x) => {
      const w = Math.round((x.valoare / max) * 100);
      return `
        <div class="bar-row">
          <span>${x.an}</span>
          <div class="bar-track" role="img" aria-label="${x.an}: ${x.valoare} decese, ${x.procent}% din total">
            <div class="bar-fill" style="width:${w}%"></div>
          </div>
          <span>${x.valoare.toLocaleString("ro-RO")} (${x.procent}%)</span>
        </div>`;
    }).join("");
    return `
      <div class="card">
        <div class="card-title">${esc(COCAINE_CHART.titlu)}</div>
        <div class="bar-wrap">${rows}</div>
        <p class="muted">Sursă: ${src ? `${esc(src.sursa)}, publicat ${src.anPublicare}` : "EUDA"}.
          ${src && src.link ? `<a href="${esc(src.link)}" target="_blank" rel="noopener noreferrer">Vezi raportul</a>.` : ""}
          Comparația se referă doar la țările cu date pentru ambii ani; nu reprezintă toată Europa și nu se aplică direct României.</p>
      </div>`;
  }

  function homeView() {
    const subsCards = SUBS.map((s) => `
      <a class="card" href="#/substanta/${esc(s.id)}">
        <div class="icon-dot" style="background:${esc(s.culoare)}" aria-hidden="true">${esc(s.nume.charAt(0))}</div>
        <div class="card-title">${esc(s.nume)}</div>
        <p class="muted">${esc(s.rezumat)}</p>
      </a>`).join("");

    const latest = STUDIES.slice(0, 3).map((s) => `
      <article class="card">
        <div class="card-title">${esc(s.titluTradus || s.titluOriginal)}</div>
        <p class="muted">${esc(s.autori)} · ${s.anPublicare ?? "an nedeclarat"} · ${esc(s.tara)}</p>
        ${tipBadge(s.tipCercetare)}
        <p><a href="#/studii">Citește în bibliotecă</a></p>
      </article>`).join("");

    const html = `
      <section class="hero" aria-labelledby="hero-title">
        <div>
          <h1 id="hero-title">Informația corectă poate schimba o viață.</h1>
          <p class="lead">Descoperă ce spun studiile despre consumul de substanțe, învață să recunoști semnele unui consum problematic și găsește resurse de sprijin.</p>
          <div class="btn-row">
            <a class="btn" href="#/studii">Explorează studiile</a>
            <a class="btn btn-outline" href="#/substante">Înțelege substanțele</a>
            <a class="btn btn-teal" href="#/ajutor">Găsește ajutor</a>
          </div>
        </div>
        <div class="hero-art">${heroSvg}</div>
      </section>

      <section class="section" aria-labelledby="stats-title">
        <div class="section-head">
          <h2 id="stats-title">Date și statistici</h2>
          <span class="muted">Fiecare cifră are sursă, populație, locație și an.</span>
        </div>
        <div class="grid-3">
          ${(SITE.statistici || []).map(statCard).join("")}
        </div>
        <div class="section">${cocaineChart()}</div>
        <div class="alert alert-info">
          Nu comparăm direct date obținute prin metode diferite. Estimările europene nu sunt date pentru România.
        </div>
      </section>

      <section class="section" aria-labelledby="subs-title">
        <div class="section-head">
          <h2 id="subs-title">Explorator de substanțe</h2>
          <a href="#/substante">Toate substanțele →</a>
        </div>
        <div class="grid">${subsCards}</div>
      </section>

      <section class="section" aria-labelledby="studies-title">
        <div class="section-head">
          <h2 id="studies-title">Ultimele studii și rapoarte</h2>
          <a href="#/studii">Biblioteca de cercetare →</a>
        </div>
        <div class="grid-3">${latest}</div>
      </section>

      <section class="section alert alert-info" aria-labelledby="help-title">
        <h2 id="help-title" style="margin-top:0">Ai nevoie de ajutor?</h2>
        <p><strong>Nu trebuie să gestionezi singur această situație.</strong></p>
        <div class="btn-row">
          <a class="btn btn-teal" href="#/ajutor">Caută servicii de sprijin</a>
          <a class="btn btn-outline" href="#/schimb">Cum pot cere ajutor?</a>
          <a class="btn btn-outline" href="#/familie">Ajut pe cineva apropiat</a>
        </div>
      </section>

      <section class="section" aria-labelledby="edu-title">
        <div class="section-head">
          <h2 id="edu-title">Educație și prevenție</h2>
          <a href="#/educatie">Toate quizurile →</a>
        </div>
        <div class="grid-3">
          ${QUIZZES.slice(0, 3).map((q) => `
            <a class="card" href="#/quiz/${esc(q.id)}">
              <div class="card-title">${esc(q.titlu)}</div>
              <p class="muted">${q.intrebari.length} întrebări, cu explicații și surse.</p>
            </a>`).join("")}
        </div>
      </section>`;
    return { title: "Pagina principală", html };
  }

  /* ---------- Substanțe ---------- */
  function substanteView() {
    const glossary = (SITE.glosar || []).map((g) => `
      <div class="card"><div class="card-title">${esc(g.termen)}</div><p>${esc(g.def)}</p></div>`).join("");
    const html = `
      <h1>Explorator de substanțe</h1>
      <p class="lead">Fiecare fișă explică ce este substanța, cum acționează, ce riscuri are și unde se poate cere ajutor.</p>
      <div class="filters">
        <div class="field">
          <label for="subSearch">Caută după nume sau cuvânt-cheie</label>
          <input id="subSearch" type="search" placeholder="ex. alcool, opioide, sedative" autocomplete="off" />
        </div>
      </div>
      <p class="results-count" id="subCount" aria-live="polite"></p>
      <div id="subGrid" class="grid"></div>
      <h2>Ce înseamnă termenii</h2>
      <p class="muted">Diferențele dintre consum, consum problematic, tulburare și dependență sunt importante pentru a înțelege situația corect.</p>
      <div class="grid-3">${glossary}</div>`;
    return {
      title: "Substanțe",
      html,
      init() {
        const input = document.getElementById("subSearch");
        const grid = document.getElementById("subGrid");
        const count = document.getElementById("subCount");
        const draw = () => {
          const q = norm(input.value.trim());
          const list = SUBS.filter((s) => norm(`${s.nume} ${s.categorie} ${s.rezumat}`).includes(q));
          count.textContent = `${list.length} ${list.length === 1 ? "fișă" : "fișe"} găsite`;
          grid.innerHTML = list.length
            ? list.map((s) => `
              <a class="card" href="#/substanta/${esc(s.id)}">
                <div class="icon-dot" style="background:${esc(s.culoare)}" aria-hidden="true">${esc(s.nume.charAt(0))}</div>
                <div class="card-title">${esc(s.nume)}</div>
                <span class="badge">${esc(s.categorie)}</span>
                <p class="muted">${esc(s.rezumat)}</p>
              </a>`).join("")
            : `<div class="empty" style="grid-column:1/-1">Nu am găsit nicio fișă pentru „${esc(input.value)}”. Încercați alt cuvânt sau <button type="button" class="btn btn-sm btn-outline" data-clear="subSearch">reafișați toate fișele</button>.</div>`;
        };
        input.addEventListener("input", draw);
        grid.addEventListener("click", (e) => {
          if (e.target.closest("[data-clear]")) { input.value = ""; draw(); input.focus(); }
        });
        draw();
      }
    };
  }

  function substantaView(id) {
    const s = SUBS.find((x) => x.id === id);
    if (!s) return notFound("Fișa substanței nu a fost găsită.");
    const titles = SITE.sectiuniFiseSubstanta;
    const toc = titles.map((t, i) => `<button type="button" class="btn-sm btn-outline" style="border-radius:999px;padding:.3rem .6rem;font-size:.85rem" data-scroll="sec-${i}">${i + 1}. ${esc(t)}</button>`).join("");
    const sections = s.sectiuni.map((txt, i) => `
      <section class="fiche-section" id="sec-${i}" tabindex="-1" aria-labelledby="sec-h-${i}">
        <h3 id="sec-h-${i}"><span class="fiche-num" aria-hidden="true">${i + 1}</span>${esc(titles[i] || "")}</h3>
        <p>${esc(txt)}</p>
      </section>`).join("");
    const html = `
      <p><a href="#/substante">← Toate substanțele</a></p>
      <header class="fiche-header">
        <div class="fiche-dot" style="background:${esc(s.culoare)}" aria-hidden="true">${esc(s.nume.charAt(0))}</div>
        <div>
          <h1>${esc(s.nume)}</h1>
          <span class="badge">${esc(s.categorie)}</span>
        </div>
      </header>
      <div class="alert alert-warn">
        <strong>Informație educațională</strong>
        <p>Această fișă nu oferă diagnostic, doze sau instrucțiuni de consum. Dacă vă faceți griji pentru dumneavoastră sau pentru cineva apropiat, discutați cu un medic sau un psiholog.</p>
      </div>
      ${callout112}
      <nav aria-label="Cuprins fișă"><div class="toc">${toc}</div></nav>
      ${sections}
      <p class="muted">Conținutul fișei necesită validare de către un specialist înainte de publicarea oficială. Data ultimei verificări: neconfirmată. Pentru cercetări, vezi <a href="#/studii">Biblioteca de cercetare</a>.</p>`;
    return {
      title: s.nume,
      html,
      init(root) {
        root.querySelectorAll("[data-scroll]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const el = document.getElementById(btn.getAttribute("data-scroll"));
            if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); el.focus({ preventScroll: true }); }
          });
        });
      }
    };
  }

  /* ---------- Biblioteca de studii ---------- */
  function studiiView() {
    const subOpts = SUBS.map((s) => `<option value="${esc(s.id)}">${esc(s.nume)}</option>`).join("");
    const countryOpts = uniq(STUDIES.map((s) => s.tara)).map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    const yearOpts = uniq(STUDIES.map((s) => s.anPublicare)).reverse().map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    const typeOpts = uniq(STUDIES.map((s) => s.tipCercetare)).map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    const themeOpts = uniq(STUDIES.map((s) => s.tema)).map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");

    const html = `
      <h1>Biblioteca de cercetare</h1>
      <p class="lead">Studii și rapoarte cu rezumate în limba română, linkuri către sursele originale și informații despre limitele fiecărei surse.</p>

      <div class="alert alert-info">
        <strong>Cum citiți aceste surse</strong>
        <p>Un <em>studiu evaluat de specialiști</em> a trecut evaluarea altor cercetători înainte de publicare. Un <em>raport instituțional</em> este scris de o organizație (de exemplu OMS sau EUDA) și rezumă date din multe țări. Un <em>studiu observațional</em> urmărește persoane fără a interveni. O <em>opinie</em> sau un editorial exprimă o părere, nu o dovadă. O <em>sinteză sistematică</em> combină mai multe studii și este, în general, cea mai solidă formă de dovadă.</p>
        <p class="muted">Rezumatele se bazează pe informațiile disponibile public. Dacă nu avem acces la articolul integral, acest lucru este indicat în fișa studiului.</p>
      </div>

      <form class="filters" id="studyFilters" role="search" aria-label="Filtrează studiile" novalidate>
        <div class="field"><label for="fQ">Cuvinte-cheie</label><input id="fQ" type="search" placeholder="ex. decese, tratament" autocomplete="off" /></div>
        <div class="field"><label for="fSub">Substanță</label><select id="fSub"><option value="">Toate</option>${subOpts}</select></div>
        <div class="field"><label for="fTara">Țară sau regiune</label><select id="fTara"><option value="">Toate</option>${countryOpts}</select></div>
        <div class="field"><label for="fAn">An</label><select id="fAn"><option value="">Toți</option>${yearOpts}</select></div>
        <div class="field"><label for="fTip">Tipul cercetării</label><select id="fTip"><option value="">Toate</option>${typeOpts}</select></div>
        <div class="field"><label for="fTema">Tema principală</label><select id="fTema"><option value="">Toate</option>${themeOpts}</select></div>
      </form>
      <p class="results-count" id="studyCount" aria-live="polite"></p>
      <div id="studyList"></div>`;

    return {
      title: "Biblioteca de cercetare",
      html,
      init() {
        const ids = ["fQ", "fSub", "fTara", "fAn", "fTip", "fTema"];
        const $f = (id) => document.getElementById(id);
        const list = document.getElementById("studyList");
        const count = document.getElementById("studyCount");

        const draw = () => {
          const q = norm($f("fQ").value.trim());
          const sub = $f("fSub").value, tara = $f("fTara").value, an = $f("fAn").value;
          const tip = $f("fTip").value, tema = $f("fTema").value;
          const res = STUDIES.filter((s) => {
            if (q && !norm([s.titluOriginal, s.titluTradus, s.autori, s.tema, s.rezultate, s.populatie].join(" ")).includes(q)) return false;
            if (sub && !(s.substante || []).includes(sub)) return false;
            if (tara && s.tara !== tara) return false;
            if (an && String(s.anPublicare) !== an) return false;
            if (tip && s.tipCercetare !== tip) return false;
            if (tema && s.tema !== tema) return false;
            return true;
          });
          count.textContent = `${res.length} ${res.length === 1 ? "înregistrare" : "înregistrări"} din ${STUDIES.length}`;
          if (!res.length) {
            list.innerHTML = `<div class="empty">Niciun studiu nu corespunde filtrelor. Încercați să eliminați unele filtre. Biblioteca este în curs de extindere.</div>`;
            return;
          }
          list.innerHTML = res.map((s) => `
            <details class="study">
              <summary>${esc(s.titluTradus && s.titluTradus !== s.titluOriginal ? s.titluTradus : s.titluOriginal)}</summary>
              <p class="muted" style="margin:.4rem 0 .6rem">${s.titluTradus && s.titluTradus !== s.titluOriginal ? `Titlu original: ${esc(s.titluOriginal)}` : ""}</p>
              <div style="display:flex;flex-wrap:wrap;gap:.2rem">
                ${tipBadge(s.tipCercetare)} <span class="badge">${s.anPublicare ?? "an nedeclarat"}</span> ${verifBadge(s.verificat)}
              </div>
              <dl>
                <dt>Autori sau instituție</dt><dd>${esc(s.autori)}</dd>
                <dt>Anul publicării</dt><dd>${s.anPublicare ?? "nedeclarat"}</dd>
                <dt>Țara și populația</dt><dd>${esc(s.tara)}. ${esc(s.populatie)}</dd>
                <dt>Tipul cercetării</dt><dd>${esc(s.tipCercetare)}. Nivel de dovezi: ${esc(s.nivelDovezi)}</dd>
                <dt>Metodologie</dt><dd>${esc(s.metodologie)}</dd>
                <dt>Principalele rezultate</dt><dd>${esc(s.rezultate)}</dd>
                <dt>Limitele studiului</dt><dd>${esc(s.limite)}</dd>
                <dt>DOI sau identificator</dt><dd>${s.doi ? esc(s.doi) : esc(s.doiNota || "Nu este disponibil")}</dd>
                <dt>Sursa originală</dt><dd><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.url)}</a></dd>
                <dt>Data ultimei verificări</dt><dd>${s.ultimaVerificare ? fmtDate(s.ultimaVerificare) : "neconfirmată"}</dd>
              </dl>
            </details>`).join("");
        };
        ids.forEach((id) => {
          const el = $f(id);
          el.addEventListener(el.tagName === "SELECT" ? "change" : "input", draw);
        });
        $f("studyFilters").addEventListener("submit", (e) => { e.preventDefault(); draw(); });
        draw();
      }
    };
  }

  /* ---------- Găsește ajutor ---------- */
  function ajutorView() {
    const typeOpts = SERVICE_TYPES.map((t) => `<option value="${esc(t.value)}">${esc(t.label)}</option>`).join("");
    const judete = uniq(SERVICES.map((s) => s.judet));
    const judOpts = judete.map((j) => `<option value="${esc(j)}">${esc(j)}</option>`).join("");
    const officialList = OFFICIAL.map((o) => `
      <li>${o.link ? `<a href="${esc(o.link)}" target="_blank" rel="noopener noreferrer">${esc(o.nume)}</a>` : esc(o.nume)}: ${esc(o.nota)}</li>`).join("");

    const html = `
      <h1>Găsește ajutor</h1>
      <div class="alert alert-danger">
        <strong>Urgență reală?</strong>
        <p>${esc(SITE.urgenta.text)}</p>
        <a class="btn btn-emergency" href="tel:112">Sună 112</a>
      </div>

      <p class="lead">Directorul de servicii este construit doar cu informații verificate din surse oficiale. Nu publicăm adrese, numere sau programe neconfirmate.</p>

      <form class="filters" id="svcFilters" role="search" aria-label="Filtrează serviciile" novalidate>
        <div class="field"><label for="sQ">Caută după nume sau serviciu</label><input id="sQ" type="search" autocomplete="off" /></div>
        <div class="field"><label for="sTip">Tipul serviciului</label><select id="sTip"><option value="">Toate</option>${typeOpts}</select></div>
        <div class="field"><label for="sJud">Județ</label><select id="sJud"><option value="">Toate</option>${judOpts}</select></div>
      </form>
      <p class="results-count" id="svcCount" aria-live="polite"></p>
      <div id="svcList"></div>

      <h2>Surse oficiale pentru verificare</h2>
      <p>Până când directorul este completat cu servicii verificate, puteți începe cu:</p>
      <ul>${officialList}</ul>
      <p class="muted">Cum verificați un serviciu: confirmați numele, adresa și telefonul pe site-ul oficial al instituției, apoi întrebați direct programul și serviciile oferite. Medicul de familie poate face o primă orientare.</p>`;

    return {
      title: "Găsește ajutor",
      html,
      init() {
        const $f = (id) => document.getElementById(id);
        const list = $f("svcList");
        const count = $f("svcCount");
        const draw = () => {
          const q = norm($f("sQ").value.trim());
          const tip = $f("sTip").value, jud = $f("sJud").value;
          const res = SERVICES.filter((s) => {
            if (q && !norm(`${s.nume} ${s.localitate} ${(s.servicii || []).join(" ")}`).includes(q)) return false;
            if (tip && s.tip !== tip) return false;
            if (jud && s.judet !== jud) return false;
            return true;
          });
          count.textContent = `${res.length} ${res.length === 1 ? "serviciu verificat" : "servicii verificate"}`;
          if (!res.length) {
            list.innerHTML = `<div class="empty">
              ${SERVICES.length === 0
                ? "Nu avem încă servicii verificate în această versiune a aplicației. Nu afișăm adrese sau numere neconfirmate. Folosiți sursele oficiale de mai jos sau medicul de familie."
                : "Niciun serviciu nu corespunde filtrelor. Încercați alte criterii."}
            </div>`;
            return;
          }
          list.innerHTML = `<div class="grid">${res.map((s) => {
            const tel = s.telefon ? String(s.telefon).replace(/\s+/g, "") : "";
            return `
              <article class="card">
                <div class="card-title">${esc(s.nume)}</div>
                <span class="badge">${esc((SERVICE_TYPES.find((t) => t.value === s.tip) || {}).label || s.tip)}</span>
                <p><strong>Adresa:</strong> ${esc(s.adresa)}</p>
                <p><strong>Telefon:</strong> ${tel ? `<a href="tel:${esc(tel)}">${esc(s.telefon)}</a>` : "neconfirmat"}</p>
                <p><strong>Program:</strong> ${esc(s.program || "neconfirmat")}</p>
                <p><strong>Servicii:</strong> ${esc((s.servicii || []).join(", "))}</p>
                <p class="muted">Sursa: ${s.linkSursa ? `<a href="${esc(s.linkSursa)}" target="_blank" rel="noopener noreferrer">${esc(s.sursaOficiala)}</a>` : esc(s.sursaOficiala)} · Verificat: ${fmtDate(s.dataVerificarii)}</p>
              </article>`;
          }).join("")}</div>`;
        };
        $f("sQ").addEventListener("input", draw);
        $f("sTip").addEventListener("change", draw);
        $f("sJud").addEventListener("change", draw);
        $f("svcFilters").addEventListener("submit", (e) => { e.preventDefault(); draw(); });
        draw();
      }
    };
  }

  /* ---------- Vreau să schimb ceva ---------- */
  function schimbView() {
    const triggers = ["Stres sau presiune", "Singurătate", "Petreceri sau locuri unde se consumă", "Oboseală sau insomnie", "Conflicte în familie sau la muncă", "Plictiseală", "Durere sau probleme de sănătate"];
    const triggerHtml = triggers.map((t, i) => `
      <label class="option"><input type="checkbox" name="trigger" value="${esc(t)}" id="tr${i}" /> <span>${esc(t)}</span></label>`).join("");

    const html = `
      <h1>Vreau să schimb ceva</h1>
      <p class="lead">Un spațiu pentru a gândi pașii următori, în ritmul dumneavoastră. Nu există un diagnostic automat și nu sunteți obligat să completați nimic.</p>

      <h2>Ghid pentru primul pas</h2>
      <ol>
        <li>Notați ce vă face să vă simțiți mai bine și mai rău, fără a vă judeca.</li>
        <li>Alegeți o persoană de încredere cu care puteți vorbi despre situație.</li>
        <li>Programați o discuție cu medicul de familie sau cu un specialist în sănătate mintală.</li>
        <li>Stabiliți un pas mic pentru săptămâna aceasta, pe care îl puteți îndeplini.</li>
      </ol>

      <h2>Întrebări de reflecție</h2>
      <div class="card">
        <ul>
          <li>Ce schimbare ați vrea să vedeți în următoarele luni?</li>
          <li>În ce momente apare dorința de a consuma?</li>
          <li>Ce ați încercat deja și ce a ajutat, chiar puțin?</li>
          <li>Cine din viața dumneavoastră vă poate sprijini?</li>
          <li>Ce v-ar ajuta să ceri ajutor fără teamă de judecată?</li>
        </ul>
      </div>

      <h2>Situații care declanșează dorința de consum</h2>
      <p class="muted">Bifați ce vi se potrivește. Lista rămâne doar în pagină și nu este salvată.</p>
      <fieldset class="field" style="border:0;padding:0">
        <legend class="label">Situații întâlnite</legend>
        ${triggerHtml}
      </fieldset>
      <div class="alert alert-info" id="triggerSummary" aria-live="polite">Nu ați bifat încă nicio situație.</div>

      <h2>Planul personal de sprijin</h2>
      <p class="muted">Completarea planului este opțională. Îl puteți salva doar pe acest dispozitiv.</p>
      <form id="planForm" novalidate class="card">
        <div class="field">
          <label for="pSit">Situațiile în care vă este cel mai greu (minim 10 caractere)</label>
          <textarea id="pSit" aria-describedby="pSitErr"></textarea>
          <span class="field-error" id="pSitErr"></span>
        </div>
        <div class="field">
          <label for="pPas">Primul pas pe care îl puteți face săptămâna aceasta (minim 5 caractere)</label>
          <textarea id="pPas" aria-describedby="pPasErr" style="min-height:70px"></textarea>
          <span class="field-error" id="pPasErr"></span>
        </div>
        <div class="field">
          <label for="pPers">Persoana de încredere pe care o puteți contacta</label>
          <select id="pPers" aria-describedby="pPersErr">
            <option value="">Alegeți</option>
            <option>Prieten sau prietenă</option>
            <option>Membru al familiei</option>
            <option>Partener sau partenera</option>
            <option>Coleg sau profesor</option>
            <option>Medicul de familie</option>
            <option>Altă persoană</option>
          </select>
          <span class="field-error" id="pPersErr"></span>
        </div>
        <div class="btn-row">
          <button class="btn" type="submit">Salvează planul pe acest dispozitiv</button>
          <button class="btn btn-outline" type="button" id="planDelete">Șterge planul salvat</button>
        </div>
        <p class="muted" id="planStatus" role="status" aria-live="polite"></p>
      </form>
      <div id="planSaved"></div>

      <h2>Discuția cu medicul</h2>
      <div class="card">
        <p>Puteți începe cu aceste întrebări:</p>
        <ul>
          <li>Ce evaluare ați recomanda pentru situația mea?</li>
          <li>Există riscuri medicale dacă reduc sau opresc consumul?</li>
          <li>Ce opțiuni de tratament și sprijin psihologic există?</li>
          <li>La ce semne ar trebui să merg de urgență?</li>
        </ul>
      </div>

      <div class="alert alert-danger" style="margin-top:1.2rem">
        <strong>Atenție medicală importantă</strong>
        <p>Oprirea bruscă a alcoolului sau a unor sedative după un consum intens ori prelungit poate provoca sevraj periculos. Nu încercați detoxifierea singur. Discutați cu un medic înainte de orice schimbare și solicitați evaluare medicală.</p>
      </div>

      <h2>Consiliere și tratament</h2>
      <p>Psihoterapia (de exemplu terapia cognitiv-comportamentală sau interviul motivațional) și sprijinul medical au dovezi solide. Recăderile sunt frecvente în procesul de schimbare și nu înseamnă eșec. Fiecare încercare aduce informații utile.</p>

      <h2>Jurnal local opțional</h2>
      <div class="alert alert-warn">
        <strong>Confidențialitate</strong>
        <p>Notele rămân doar în acest browser, pe acest dispozitiv. Nu sunt trimise nimănui și nu sunt criptate. Oricine are acces la dispozitiv sau la browser le poate vedea. Nu scrieți date de identificare.</p>
      </div>
      <form id="journalForm" novalidate class="card">
        <div class="field">
          <label for="jText">Notă nouă (minim 3 caractere)</label>
          <textarea id="jText" aria-describedby="jErr"></textarea>
          <span class="field-error" id="jErr"></span>
        </div>
        <div class="btn-row"><button class="btn btn-teal" type="submit">Adaugă nota</button></div>
      </form>
      <div id="journalList"></div>`;

    return {
      title: "Vreau să schimb ceva",
      html,
      init() {
        const $f = (id) => document.getElementById(id);

        // Situații bifate
        const updateTriggers = () => {
          const checked = [...document.querySelectorAll('input[name="trigger"]:checked')].map((c) => c.value);
          $f("triggerSummary").textContent = checked.length
            ? `Ați bifat ${checked.length} situații: ${checked.join(", ")}. Puteți lua în calcul aceste momente în planul personal.`
            : "Nu ați bifat încă nicio situație.";
        };
        document.querySelectorAll('input[name="trigger"]').forEach((c) => c.addEventListener("change", updateTriggers));

        // Plan personal
        const renderPlan = () => {
          const p = store.get("mc_plan_v1", null);
          $f("planSaved").innerHTML = p ? `
            <div class="card" style="margin-top:1rem">
              <div class="card-title">Planul salvat</div>
              <p><strong>Situații dificile:</strong> ${esc(p.situatii)}</p>
              <p><strong>Primul pas:</strong> ${esc(p.pas)}</p>
              <p><strong>Persoana de încredere:</strong> ${esc(p.persoana)}</p>
              <p class="muted">Salvat la ${esc(new Date(p.data).toLocaleString("ro-RO"))}</p>
            </div>` : "";
        };
        const setErr = (id, msg) => { $f(id + "Err").textContent = msg; $f(id).setAttribute("aria-invalid", msg ? "true" : "false"); };

        $f("planForm").addEventListener("submit", (e) => {
          e.preventDefault();
          const sit = $f("pSit").value.trim(), pas = $f("pPas").value.trim(), pers = $f("pPers").value;
          let ok = true;
          if (sit.length < 10) { setErr("pSit", "Scrieți cel puțin 10 caractere."); ok = false; } else setErr("pSit", "");
          if (pas.length < 5) { setErr("pPas", "Scrieți cel puțin 5 caractere."); ok = false; } else setErr("pPas", "");
          if (!pers) { setErr("pPers", "Alegeți o persoană de încredere."); ok = false; } else setErr("pPers", "");
          if (!ok) { $f("planStatus").textContent = "Verificați câmpurile marcate."; return; }
          const saved = store.set("mc_plan_v1", { situatii: sit, pas, persoana: pers, data: new Date().toISOString() });
          $f("planStatus").textContent = saved ? "Planul a fost salvat pe acest dispozitiv." : "Planul nu a putut fi salvat în acest browser. Puteți copia textul manual.";
          renderPlan();
        });
        $f("planDelete").addEventListener("click", () => {
          store.del("mc_plan_v1");
          $f("planStatus").textContent = "Planul salvat a fost șters.";
          renderPlan();
        });

        // Jurnal
        const renderJournal = () => {
          const entries = store.get("mc_journal_v1", []);
          $f("journalList").innerHTML = entries.length
            ? entries.slice().reverse().map((en, idx) => `
              <article class="card" style="margin-top:.8rem">
                <p class="muted">${esc(new Date(en.data).toLocaleString("ro-RO"))}</p>
                <p>${esc(en.text)}</p>
                <button type="button" class="btn btn-sm btn-outline" data-del="${entries.length - 1 - idx}">Șterge nota</button>
              </article>`).join("")
            : `<p class="muted">Nu există note salvate.</p>`;
          document.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => {
            const list = store.get("mc_journal_v1", []);
            list.splice(Number(b.getAttribute("data-del")), 1);
            store.set("mc_journal_v1", list);
            renderJournal();
          }));
        };
        $f("journalForm").addEventListener("submit", (e) => {
          e.preventDefault();
          const text = $f("jText").value.trim();
          if (text.length < 3) { $f("jErr").textContent = "Scrieți cel puțin 3 caractere."; return; }
          $f("jErr").textContent = "";
          const list = store.get("mc_journal_v1", []);
          list.push({ text, data: new Date().toISOString() });
          store.set("mc_journal_v1", list.slice(-50));
          $f("jText").value = "";
          renderJournal();
        });

        renderPlan();
        renderJournal();
      }
    };
  }

  /* ---------- Familie și prieteni ---------- */
  function familieView() {
    const guides = [
      {
        t: "Cum începi o discuție",
        p: "Alegeți un moment liniștit, fără reproșuri și fără public. Vorbiți despre ce ați observat și despre cum vă simțiți, nu despre ce „nu face bine” persoana.",
        dialog: [
          ["Tu", "Am observat că ești obosit în ultima vreme și îmi fac griji. Vrei să vorbim?"],
          ["Persoana", "Nu e nimic, sunt bine."],
          ["Tu", "Bine. Vreau doar să știi că ești important pentru mine și că mă pot baza pe tine și tu pe mine."]
        ]
      },
      {
        t: "Cum oferi sprijin fără să judeci",
        p: "Ascultați, validați emoțiile și evitați ultimatumurile. Recunoașterea unui consum este un pas important, chiar dacă este mic.",
        dialog: [
          ["Persoana", "Am băut mai mult decât credeam aseară."],
          ["Tu", "Mulțumesc că mi-ai spus. Cum te simți acum?"],
          ["Persoana", "Rușine și obosit."],
          ["Tu", "Înțeleg. Dacă vrei, putem căuta împreună un medic sau un psiholog."]
        ]
      },
      {
        t: "Cum stabilești limite sănătoase",
        p: "Limitele vă protejează pe dumneavoastră și pe ceilalți. Fiți clari, calmi și consecvenți. O limită este despre ce faceți dumneavoastră, nu despre controlul celuilalt.",
        dialog: [
          ["Tu", "Nu te voi conduce dacă ai băut. Te sun dacă ai nevoie să ajungi acasă."],
          ["Persoana", "Exagerezi."],
          ["Tu", "Poate. Hotărârea mea rămâne. Ne putem discuta mâine, când ești odihnit."]
        ]
      },
      {
        t: "Cum recunoști o posibilă urgență",
        p: "Sunați 112 dacă persoana nu răspunde, respiră foarte greu sau deloc, are convulsii, a luat o cantitate periculoasă sau este confuză grav. Nu lăsați persoana singură. Dacă respiră, așezați-o în poziție laterală de siguranță.",
        dialog: []
      },
      {
        t: "Cum găsești ajutor profesional",
        p: "Primul pas poate fi medicul de familie, care poate face o evaluare și vă poate orienta. Puteți merge și singur la consultație, pentru a înțelege opțiunile.",
        dialog: []
      },
      {
        t: "Cum ai grijă de propria sănătate emoțională",
        p: "Nu sunteți responsabil pentru recuperarea altcuiva și nu puteți garanta rezultatul. Căutați sprijin pentru dumneavoastră, de exemplu la un psiholog sau într-un grup de sprijin pentru familii, dacă există în zona dumneavoastră.",
        dialog: []
      }
    ];
    const html = `
      <h1>Familie și prieteni</h1>
      <p class="lead">Ghiduri practice și exemple scurte de conversații. Recuperarea este un proces al persoanei, iar familia poate sprijini, dar nu poate asigura singură rezultatul.</p>
      ${guides.map((g) => `
        <section class="card" style="margin-bottom:1rem" aria-labelledby="g-${esc(norm(g.t).replace(/\s+/g, "-"))}">
          <h2 id="g-${esc(norm(g.t).replace(/\s+/g, "-"))}" style="margin-top:0;font-size:1.2rem">${esc(g.t)}</h2>
          <p>${esc(g.p)}</p>
          ${g.dialog.length ? `
            <div class="alert alert-info" style="margin:0">
              <strong>Exemplu de conversație</strong>
              ${g.dialog.map(([who, what]) => `<p style="margin:.3rem 0"><strong>${esc(who)}:</strong> ${esc(what)}</p>`).join("")}
            </div>` : ""}
        </section>`).join("")}
      ${callout112}
      <p class="muted">Dacă vă simțiți copleșit, vorbiți cu un specialist. Nu aveți nevoie să fiți „perfect” pentru a cere ajutor.</p>`;
    return { title: "Familie și prieteni", html };
  }

  /* ---------- Educație și quizuri ---------- */
  function educatieView() {
    const cards = QUIZZES.map((q) => `
      <article class="card">
        <div class="card-title">${esc(q.titlu)}</div>
        <p class="muted">${q.intrebari.length} întrebări cu explicații și referințe către surse.</p>
        <a class="btn btn-sm" href="#/quiz/${esc(q.id)}">Începe quizul</a>
      </article>`).join("");
    return {
      title: "Educație și quizuri",
      html: `
        <h1>Educație și prevenție</h1>
        <p class="lead">Quizurile sunt educative. Nu sunt teste de diagnostic și nu evaluează situația dumneavoastră personală.</p>
        <div class="grid">${cards}</div>
        <h2>Articole scurte</h2>
        <div class="grid-3">
          <article class="card"><div class="card-title">Ce înseamnă consumul problematic?</div><p>Consumul problematic este un consum care aduce daune, chiar dacă nu există un diagnostic. Diagnosticul clinic se stabilește doar de un profesionist.</p><a href="#/substante">Vezi glosarul →</a></article>
          <article class="card"><div class="card-title">De ce este periculos să amesteci substanțe?</div><p>Efectele se pot aduna, iar combinațiile cu alcoolul sau cu sedativele pot încetini respirația grav.</p><a href="#/substanta/opioide">Vezi fișa opioidelor →</a></article>
          <article class="card"><div class="card-title">Cum citești un studiu?</div><p>Verificați tipul sursei, populația, anul și limitele. O sinteză sistematică are, în general, mai multă greutate decât un singur studiu.</p><a href="#/studii">Biblioteca de cercetare →</a></article>
        </div>`
    };
  }

  function quizView(id) {
    const q = QUIZZES.find((x) => x.id === id);
    if (!q) return notFound("Quizul nu a fost găsit.");
    const items = q.intrebari.map((it, i) => `
      <fieldset class="card" style="margin-bottom:1rem" data-q="${i}">
        <legend class="quiz-q">${i + 1}. ${esc(it.text)}</legend>
        ${it.optiuni.map((o, j) => `
          <label class="option"><input type="radio" name="q${i}" value="${j}" /> <span>${esc(o)}</span></label>`).join("")}
        <div class="feedback" hidden data-fb="${i}"></div>
      </fieldset>`).join("");
    return {
      title: q.titlu,
      html: `
        <p><a href="#/educatie">← Toate quizurile</a></p>
        <h1>${esc(q.titlu)}</h1>
        <p class="muted">Răspundeți la toate întrebările, apoi verificați. Quizul nu este un test de diagnostic.</p>
        <form id="quizForm" novalidate>
          ${items}
          <p class="field-error" id="quizErr" role="alert"></p>
          <div class="btn-row">
            <button class="btn" type="submit">Verifică răspunsurile</button>
            <button class="btn btn-outline" type="button" id="quizReset">Repetă quizul</button>
          </div>
        </form>
        <section id="quizResult" aria-live="polite" tabindex="-1"></section>
        <p class="muted">Sursă: ${esc(q.sursa)}</p>`,
      init() {
        const form = document.getElementById("quizForm");
        const result = document.getElementById("quizResult");
        const err = document.getElementById("quizErr");
        form.addEventListener("submit", (e) => {
          e.preventDefault();
          const unanswered = [];
          q.intrebari.forEach((_, i) => {
            if (!form.querySelector(`input[name="q${i}"]:checked`)) unanswered.push(i + 1);
          });
          if (unanswered.length) {
            err.textContent = `Mai aveți de răspuns la întrebările: ${unanswered.join(", ")}.`;
            return;
          }
          err.textContent = "";
          let score = 0;
          q.intrebari.forEach((it, i) => {
            const chosen = Number(form.querySelector(`input[name="q${i}"]:checked`).value);
            const ok = chosen === it.corect;
            if (ok) score++;
            const fb = form.querySelector(`[data-fb="${i}"]`);
            fb.hidden = false;
            fb.className = "feedback " + (ok ? "ok" : "bad");
            fb.innerHTML = `<strong>${ok ? "Corect." : "Nu chiar."}</strong> Răspunsul corect: ${esc(it.optiuni[it.corect])}. ${esc(it.explicatie)}`;
          });
          const pct = Math.round((score / q.intrebari.length) * 100);
          result.innerHTML = `
            <div class="card" style="margin-top:1rem">
              <div class="card-title">Scorul dumneavoastră</div>
              <div class="score">${score} din ${q.intrebari.length} (${pct}%)</div>
              <div class="progress" role="img" aria-label="${pct}% răspunsuri corecte"><span style="width:${pct}%"></span></div>
              <p>${pct === 100 ? "Excelent! Ați răspuns corect la toate întrebările." : pct >= 50 ? "Bine lucrat. Explicațiile de mai sus vă pot completa informația." : "Explorați explicațiile și fișele din aplicație. Învățarea este un proces."}</p>
              <p class="muted">Rezultatul nu este un diagnostic și nu reflectă situația dumneavoastră personală.</p>
            </div>`;
          result.focus();
        });
        document.getElementById("quizReset").addEventListener("click", () => {
          form.reset();
          form.querySelectorAll("[data-fb]").forEach((f) => { f.hidden = true; f.innerHTML = ""; f.className = "feedback"; });
          result.innerHTML = "";
          err.textContent = "";
        });
      }
    };
  }

  /* ---------- Întreabă în siguranță (mod demonstrativ, fără model AI) ---------- */
  const STOP = new Set(["pentru", "despre", "este", "care", "cum", "unde", "sunt", "cand", "daca", "poate", "asupra", "aceasta", "acest", "foarte", "mult", "ceva", "fost", "lucru", "vreau", "stiu", "despre", "avea", "face", "doar", "dupa", "inainte", "aceste"]);

  function answerQuestion(question) {
    const n = norm(question);
    if (urgencyKeywords.some((k) => n.includes(k))) {
      return {
        urgent: true,
        text: "Ceea ce descrieți poate fi o urgență. Sunați 112 acum. Nu lăsați persoana singură. Dacă persoana respiră, așezați-o în poziție laterală de siguranță. Dacă vă gândiți să vă faceți rău, vorbiți imediat cu cineva de încredere sau sunați 112. Nu puteți rezolva singur această situație."
      };
    }
    const tokens = n.split(/[^a-z0-9]+/).filter((t) => t.length >= 4 && !STOP.has(t));
    let best = null;
    SUBS.forEach((s) => {
      s.sectiuni.forEach((txt, i) => {
        const hay = norm(`${s.nume} ${s.categorie} ${txt}`);
        const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
        if (score > 0 && (!best || score > best.score)) best = { score, s, i, txt };
      });
    });
    if (!best) {
      return {
        text: "Nu am suficiente informații verificate pentru această întrebare. Puteți consulta Explorator de substanțe, Biblioteca de cercetare sau puteți discuta cu medicul de familie."
      };
    }
    return {
      text: best.txt,
      fiche: best.s,
      sectiune: SITE.sectiuniFiseSubstanta[best.i]
    };
  }

  function intrebaView() {
    const html = `
      <h1>Întreabă în siguranță</h1>
      <div class="alert alert-warn">
        <strong>Mod demonstrativ</strong>
        <p>Această versiune nu are conectat un model AI. Răspunsurile vin din fișele verificate ale aplicației, prin căutare simplă după cuvinte. Nu diagnostichează și nu prescrie tratamente. Conversația nu este salvată și rămâne doar în această pagină.</p>
      </div>
      ${callout112}
      <div class="chat-log" id="chatLog" aria-live="polite">
        <div class="msg msg-bot">Bună! Scrieți o întrebare educațională, de exemplu despre efectele alcoolului sau despre semnele unei supradoze.</div>
      </div>
      <form id="chatForm" class="card" novalidate>
        <div class="field">
          <label for="qInput">Întrebarea dumneavoastră (minim 5 caractere)</label>
          <textarea id="qInput" maxlength="400" aria-describedby="qErr"></textarea>
          <span class="field-error" id="qErr"></span>
        </div>
        <div class="btn-row"><button class="btn" type="submit">Trimite</button></div>
      </form>`;
    return {
      title: "Întreabă în siguranță",
      html,
      init() {
        const log = document.getElementById("chatLog");
        const input = document.getElementById("qInput");
        const err = document.getElementById("qErr");
        document.getElementById("chatForm").addEventListener("submit", (e) => {
          e.preventDefault();
          const q = input.value.trim();
          if (q.length < 5) { err.textContent = "Scrieți cel puțin 5 caractere."; return; }
          err.textContent = "";
          const a = answerQuestion(q);
          const userEl = document.createElement("div");
          userEl.className = "msg msg-user";
          userEl.textContent = q;
          const botEl = document.createElement("div");
          botEl.className = "msg msg-bot";
          const cite = a.fiche
            ? `<div class="cite">Sursă: fișa „${esc(a.fiche.nume)}”, secțiunea „${esc(a.sectiune)}”. Bibliografia completă este în aceeași fișă. <a href="#/substanta/${esc(a.fiche.id)}">Deschide fișa</a></div>`
            : "";
          botEl.innerHTML = `${a.urgent ? `<strong>Urgență</strong><p>${esc(a.text)}</p>` : `<p>${esc(a.text)}</p>`}${cite}
            ${a.urgent ? "" : `<p class="muted">Acesta este un răspuns educațional și nu înlocuiește evaluarea unui medic sau a unui psiholog.</p>`}`;
          log.appendChild(userEl);
          log.appendChild(botEl);
          input.value = "";
          botEl.scrollIntoView({ block: "nearest" });
        });
      }
    };
  }

  /* ---------- Despre ---------- */
  function despreView() {
    const html = `
      <h1>Despre Minte Clară</h1>
      <p class="lead">Aplicație informativă, gratuită și fără cont, despre consumul de substanțe, prevenție și accesul la ajutor.</p>
      <h2>Limitele aplicației</h2>
      <p>Informațiile au scop educațional. Nu sunt un diagnostic, nu înlocuiesc consultația medicală, psihologică sau serviciile de urgență. Conținutul medical trebuie validat de specialiști înainte de publicarea oficială.</p>
      <h2>Confidențialitate</h2>
      <p>Nu cerem cont și nu colectăm date medicale personale. Notele din jurnal și planul personal, dacă le salvați, rămân doar în browserul dumneavoastră. Nu folosim instrumente de urmărire.</p>
      <h2>Surse</h2>
      <p>Prioritizăm OMS, UNODC, EUDA, PubMed, Cochrane, NIDA, Ministerul Sănătății și Portalul legislativ. Pentru fiecare cifră sunt indicate sursa, populația, locația și anul. Datele pe care nu le-am putut verifica sunt marcate ca neconfirmate.</p>
      <div class="btn-row">
        <a class="btn btn-outline" href="https://www.who.int/" target="_blank" rel="noopener noreferrer">OMS</a>
        <a class="btn btn-outline" href="https://www.euda.europa.eu/" target="_blank" rel="noopener noreferrer">EUDA</a>
        <a class="btn btn-outline" href="https://www.unodc.org/" target="_blank" rel="noopener noreferrer">UNODC</a>
        <a class="btn btn-outline" href="https://www.ms.ro/" target="_blank" rel="noopener noreferrer">Ministerul Sănătății</a>
        <a class="btn btn-outline" href="https://legislatie.just.ro/" target="_blank" rel="noopener noreferrer">Legislație</a>
      </div>
      <p class="muted">Date actualizate: ${esc(fmtDate(SITE.dataVerificare))}.</p>`;
    return { title: "Despre", html };
  }

  function notFound(msg) {
    return {
      title: "Pagina nu a fost găsită",
      html: `<div class="empty"><p>${esc(msg)}</p><a class="btn" href="#/">Înapoi la pagina principală</a></div>`
    };
  }

  /* ---------- Router ---------- */
  const routes = {
    "": () => homeView(),
    substante: () => substanteView(),
    substanta: (p) => substantaView(p),
    studii: () => studiiView(),
    ajutor: () => ajutorView(),
    schimb: () => schimbView(),
    familie: () => familieView(),
    educatie: () => educatieView(),
    quiz: (p) => quizView(p),
    intreaba: () => intrebaView(),
    despre: () => despreView()
  };
  const NAV_MAP = { substanta: "substante", quiz: "educatie" };

  function render(focusMain) {
    const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    const [name, param] = raw.split("/");
    const handler = Object.prototype.hasOwnProperty.call(routes, name) ? routes[name] : routes[""];
    let out;
    try {
      out = handler(param);
      app.innerHTML = out.html;
      if (out.init) out.init(app);
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="alert alert-danger"><strong>A apărut o eroare la afișarea paginii.</strong>
        <p>Reîncărcați pagina. Dacă problema continuă, reveniți la <a href="#/">pagina principală</a>.</p></div>`;
      out = { title: "Eroare" };
    }
    document.title = (out.title ? out.title + " · " : "") + "Minte Clară";

    const activeKey = NAV_MAP[name] || name || "";
    document.querySelectorAll(".main-nav a").forEach((a) => {
      const isActive = a.getAttribute("data-route") === activeKey;
      a.classList.toggle("active", isActive);
      if (isActive) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });

    if (loader) loader.classList.add("hidden");
    if (focusMain) {
      const main = document.getElementById("principal");
      main.focus({ preventScroll: false });
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  document.getElementById("dataVerificare").textContent = fmtDate(SITE.dataVerificare);
  window.addEventListener("hashchange", () => render(true));
  if (!location.hash) location.hash = "#/";
  render(false);
})();
