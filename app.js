/* AI Impact Assessment — team lead input app
   Save = localStorage per team (+ JSON export/import)
   Send to Claude = Anthropic Messages API, key stored locally           */
"use strict";

/* ---------- constants ---------- */
const TEAMS = ["Logistics", "Labelling", "Customs", "Sourcing"];
const LEVELS = ["", "L1", "L2", "L3", "L4", "L5"];
const YEARS = ["", "2026", "2027", "2028", ">2028"];
const HML = ["", "H", "M", "L"];
const APPETITE = ["", "High", "Medium", "Low"];
const STORE_PREFIX = "aiimpact:";
const KEY_STORE = "aiimpact:apikey";
const MODEL = "claude-sonnet-4-6";

const SKILLSETS = [
  { id: "S1", name: "S1 DOMAIN MASTERY", desc: "Regulated processes end-to-end — customs, tax, labelling, payment terms — incl. edge cases AI cannot reason through" },
  { id: "S2", name: "S2 PLATFORM AI SKILLS", desc: "Where SAP Joule, BTP AI, Manhattan AI, Databricks Genie help — and where they introduce risk" },
  { id: "S3", name: "S3 INTEGRATION & ORCHESTRATION", desc: "Resilient flows across SAP, Infor, SaaS, custom apps — event-driven, API-first, observable" },
  { id: "S4", name: "S4 DATA QUALITY & GOVERNANCE", desc: "AI amplifies whatever data it touches — master data discipline as a core skill" },
  { id: "S5", name: "S5 PROMPT ENG. & AI-ASSISTED DEV", desc: "Enterprise prompting, validating AI-generated artifacts — baseline skill for every member" }
];

/* ---------- state ---------- */
function emptyCapability() {
  return { name: "", pct: "", aiToday: "", assumed: "", vendorCapped: false, year: "", demand: "", constraint: "" };
}
function emptyPerson() {
  return { role: "", skills: "", s1: "", s2: "", s3: "", s4: "", s5: "", adoption: "", appetite: "", direction: "" };
}
function defaultState(team) {
  return {
    team: team,
    baseline: { fteInternal: "", fteExternal: "", systems: "", aiToday: "" },
    capabilities: [emptyCapability(), emptyCapability(), emptyCapability(), emptyCapability()],
    skillsets: { S1: { base: "", first: "" }, S2: { base: "", first: "" }, S3: { base: "", first: "" }, S4: { base: "", first: "" }, S5: { base: "", first: "" } },
    people: [emptyPerson(), emptyPerson()],
    freetext: { opportunity: "", risk: "", decision: "" }
  };
}

let state = defaultState(TEAMS[0]);
let lastRecommendation = "";

/* ---------- persistence ---------- */
function storageKey(team) { return STORE_PREFIX + team; }
function persist(silent) {
  try {
    localStorage.setItem(storageKey(state.team), JSON.stringify(state));
    if (!silent) toast("Saved — " + state.team);
    setSaveStatus("Saved " + new Date().toLocaleTimeString());
  } catch (e) {
    toast("Save failed: " + e.message, true);
  }
}
function loadTeam(team) {
  const raw = localStorage.getItem(storageKey(team));
  state = raw ? JSON.parse(raw) : defaultState(team);
  state.team = team;
  renderAll();
}

/* ---------- example data (Logistics, from the input deck) ---------- */
const EXAMPLE = {
  team: "Logistics",
  baseline: {
    fteInternal: "10", fteExternal: "14",
    systems: "Manhattan WMS/TMS, Infor Nexus, custom track & trace",
    aiToday: "coding assistant in dev, none in operations"
  },
  capabilities: [
    { name: "Manage Infor / Manhattan estate", pct: "30", aiToday: "L1", assumed: "L4", vendorCapped: true, year: ">2028", demand: "+20", constraint: "Vendor roadmap sets the ceiling" },
    { name: "Custom logistics apps & tooling", pct: "20", aiToday: "L2", assumed: "L5", vendorCapped: false, year: "2028", demand: "+30", constraint: "Reskilling to agent supervision" },
    { name: "Integrations, EDI & ASN flows", pct: "15", aiToday: "L2", assumed: "L5", vendorCapped: false, year: "2028", demand: "+25", constraint: "Partner data quality" },
    { name: "Run, monitor & incident handling", pct: "25", aiToday: "L2", assumed: "L5", vendorCapped: false, year: "2027", demand: "-30", constraint: "Trust in auto-remediation" },
    { name: "Partner with DCs & carriers", pct: "10", aiToday: "L1", assumed: "L3", vendorCapped: false, year: ">2028", demand: "+10", constraint: "Human relationship work" }
  ],
  skillsets: {
    S1: { base: "H", first: "H" }, S2: { base: "M", first: "H" }, S3: { base: "H", first: "H" },
    S4: { base: "M", first: "H" }, S5: { base: "L", first: "H" }
  },
  people: [
    { role: "Senior developer", skills: "Java, integrations, EDI / ASN", s1: "M", s2: "M", s3: "H", s4: "M", s5: "H", adoption: "L3", appetite: "High", direction: "Agent orchestration lead" },
    { role: "Functional consultant", skills: "Infor configuration, testing", s1: "H", s2: "L", s3: "L", s4: "M", s5: "L", adoption: "L1", appetite: "Medium", direction: "AI-assisted config & test" },
    { role: "Ops engineer", skills: "Monitoring, incident mgmt", s1: "L", s2: "M", s3: "M", s4: "M", s5: "M", adoption: "L2", appetite: "High", direction: "Automation / SRE path" },
    { role: "Business analyst", skills: "Requirements, stakeholders", s1: "H", s2: "L", s3: "L", s4: "M", s5: "L", adoption: "L1", appetite: "Low", direction: "Product & process ownership" }
  ],
  freetext: {
    opportunity: "Autonomous message-backlog & ASN triage",
    risk: "Vendor roadmap slips — Infor agent APIs expected 2028",
    decision: "Agent platform for operations"
  }
};

/* ---------- rendering ---------- */
const $ = (sel) => document.querySelector(sel);

function opt(values, selected) {
  return values.map(v => `<option value="${v}" ${v === selected ? "selected" : ""}>${v === "" ? "—" : v}</option>`).join("");
}
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderTeams() {
  $("#teamSelect").innerHTML = TEAMS.map(t => `<option ${t === state.team ? "selected" : ""}>${t}</option>`).join("");
}

function renderBaseline() {
  $("#fteInternal").value = state.baseline.fteInternal;
  $("#fteExternal").value = state.baseline.fteExternal;
  $("#systems").value = state.baseline.systems;
  $("#aiToday").value = state.baseline.aiToday;
}

function renderCapabilities() {
  const tb = $("#capTable tbody");
  tb.innerHTML = state.capabilities.map((c, i) => `
    <tr data-i="${i}">
      <td><input type="text" data-cap="name" value="${esc(c.name)}" placeholder="capability, not role or system"></td>
      <td style="width:70px"><input type="number" data-cap="pct" min="0" max="100" value="${esc(c.pct)}"></td>
      <td style="width:78px"><select data-cap="aiToday">${opt(LEVELS, c.aiToday)}</select></td>
      <td style="width:78px"><select data-cap="assumed">${opt(LEVELS, c.assumed)}</select></td>
      <td style="width:34px"><input type="checkbox" data-cap="vendorCapped" ${c.vendorCapped ? "checked" : ""} title="vendor-capped (Infor / SAP)"></td>
      <td style="width:84px"><select data-cap="year">${opt(YEARS, c.year)}</select></td>
      <td style="width:86px"><input type="text" data-cap="demand" value="${esc(c.demand)}" placeholder="+20 / -30"></td>
      <td><input type="text" data-cap="constraint" value="${esc(c.constraint)}" placeholder="what limits or unlocks it"></td>
      <td style="width:30px"><button class="rowdel" data-del-cap="${i}" title="remove row">×</button></td>
    </tr>`).join("");
  updatePctSum();
}

function updatePctSum() {
  const sum = state.capabilities.reduce((a, c) => a + (parseFloat(c.pct) || 0), 0);
  const el = $("#pctSum");
  el.textContent = "Σ %FTE = " + sum + "%";
  el.className = "pct-sum " + (sum === 100 ? "ok" : "bad");
}

function renderSkillsets() {
  const tb = $("#skillTable tbody");
  tb.innerHTML = SKILLSETS.map(s => `
    <tr data-skill="${s.id}">
      <td class="skill-name">${s.name}</td>
      <td class="skill-desc">${s.desc}</td>
      <td style="width:84px"><select data-sk="base">${opt(HML, state.skillsets[s.id].base)}</select></td>
      <td style="width:84px"><select data-sk="first">${opt(HML, state.skillsets[s.id].first)}</select></td>
    </tr>`).join("");
}

function renderPeople() {
  const tb = $("#peopleTable tbody");
  tb.innerHTML = state.people.map((p, i) => `
    <tr data-i="${i}">
      <td class="cell-fixed" style="width:32px">${i + 1}</td>
      <td><input type="text" data-p="role" value="${esc(p.role)}" placeholder="role, not name"></td>
      <td><input type="text" data-p="skills" value="${esc(p.skills)}" placeholder="3–5 core skills"></td>
      ${["s1", "s2", "s3", "s4", "s5"].map(k =>
        `<td style="width:56px"><select data-p="${k}">${opt(HML, p[k])}</select></td>`).join("")}
      <td style="width:74px"><select data-p="adoption">${opt(LEVELS, p.adoption)}</select></td>
      <td style="width:92px"><select data-p="appetite">${opt(APPETITE, p.appetite)}</select></td>
      <td><input type="text" data-p="direction" value="${esc(p.direction)}" placeholder="target role or path — first hypothesis"></td>
      <td style="width:30px"><button class="rowdel" data-del-p="${i}" title="remove row">×</button></td>
    </tr>`).join("");
}

function renderFreetext() {
  $("#ftOpportunity").value = state.freetext.opportunity;
  $("#ftRisk").value = state.freetext.risk;
  $("#ftDecision").value = state.freetext.decision;
}

function renderAll() {
  renderTeams();
  renderBaseline();
  renderCapabilities();
  renderSkillsets();
  renderPeople();
  renderFreetext();
}

/* ---------- events ---------- */
function setByPath(path, value) {
  const parts = path.split(".");
  let obj = state;
  for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
  obj[parts[parts.length - 1]] = value;
}

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.path) { setByPath(t.dataset.path, t.value); persist(true); return; }

  const tr = t.closest("tr");
  if (t.dataset.cap && tr) {
    const i = +tr.dataset.i;
    state.capabilities[i][t.dataset.cap] = t.type === "checkbox" ? t.checked : t.value;
    if (t.dataset.cap === "pct") updatePctSum();
    persist(true); return;
  }
  if (t.dataset.sk && tr) {
    state.skillsets[tr.dataset.skill][t.dataset.sk] = t.value;
    persist(true); return;
  }
  if (t.dataset.p && tr) {
    state.people[+tr.dataset.i][t.dataset.p] = t.value;
    persist(true); return;
  }
  if (t.id === "apiKey") localStorage.setItem(KEY_STORE, t.value.trim());
});

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.delCap !== undefined) { state.capabilities.splice(+t.dataset.delCap, 1); renderCapabilities(); persist(true); }
  if (t.dataset.delP !== undefined) { state.people.splice(+t.dataset.delP, 1); renderPeople(); persist(true); }
});

$("#teamSelect").addEventListener("change", (e) => { persist(true); loadTeam(e.target.value); });
$("#btnAddCap").addEventListener("click", () => {
  if (state.capabilities.length >= 6) { toast("Max 6 capabilities", true); return; }
  state.capabilities.push(emptyCapability()); renderCapabilities(); persist(true);
});
$("#btnAddPerson").addEventListener("click", () => { state.people.push(emptyPerson()); renderPeople(); persist(true); });
$("#btnSave").addEventListener("click", () => persist(false));
$("#btnExample").addEventListener("click", () => {
  state = JSON.parse(JSON.stringify(EXAMPLE));
  renderAll(); persist(true);
  toast("Example loaded — Logistics");
});

/* export / import */
$("#btnExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  download(blob, "ai-impact-input-" + state.team.toLowerCase() + ".json");
});
$("#btnImport").addEventListener("click", () => $("#fileImport").click());
$("#fileImport").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!data.capabilities || !data.baseline) throw new Error("not an assessment file");
      state = data;
      if (!TEAMS.includes(state.team)) state.team = TEAMS[0];
      renderAll(); persist(true);
      toast("Imported — " + state.team);
    } catch (err) { toast("Import failed: " + err.message, true); }
  };
  r.readAsText(f);
  e.target.value = "";
});

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- send to Claude ---------- */
function validate() {
  const errs = [];
  const sum = state.capabilities.reduce((a, c) => a + (parseFloat(c.pct) || 0), 0);
  if (state.capabilities.filter(c => c.name.trim()).length < 3) errs.push("at least 3 named capabilities");
  if (sum !== 100) errs.push("%FTE must total 100 (currently " + sum + ")");
  if (!(parseFloat(state.baseline.fteInternal) >= 0) || state.baseline.fteInternal === "") errs.push("baseline FTE internal");
  if (!localStorage.getItem(KEY_STORE)) errs.push("API key (Connection section)");
  return errs;
}

function buildPrompt() {
  const clean = JSON.parse(JSON.stringify(state));
  clean.capabilities = clean.capabilities.filter(c => c.name.trim());
  clean.people = clean.people.filter(p => p.role.trim());
  return [
    "You are a principal org-design and AI consultant supporting a Senior Director IT for Sourcing, Logistics & Customs at adidas. Analyse the team-lead input below using the Gartner IT 2030 framework (L1–L5 automation levels; sizing = demand × automation; automation uncaps demand rather than simply cutting heads) and produce the recommendation.",
    "",
    "Derivation rules:",
    "- FTE bridge today → 2028 per capability: (FTE internal + external) × %FTE = today's FTE. Apply the stated demand Δ% and an automation effect from the shift AI-today → assumed-2028 (heuristic: each level step achieved by 2028 frees ~15–25% capacity on codifiable work; a year of \">2028\" contributes NOTHING to the 2028 bridge — use today's level). Add +10–20% supervision & governance work where automation reaches L4/L5. Show the math in a markdown table with one row per capability and a total row.",
    "- Automation gains land on the external share first; protect internal domain mastery (S1).",
    "- Role model: roles to create / redefine / phase out, each mapped to skillsets S1–S5 and an internal/external sourcing call.",
    "- Development plan per internal: reference people by row number and role only. For each: target role, S1–S5 gaps vs the team's AI-FIRST rating, development path, first 90-day milestone. Mark the whole section DRAFT — for HR & works council alignment before any individual conversation.",
    "- Transition roadmap in 3 waves to 2028: automation quick wins → reskilling waves → structure change.",
    "- Close with the top 3 risks and the decisions needed from leadership (use the free-text input).",
    "",
    "Respond in clean markdown (## headings, tables, short paragraphs). Be specific and quantitative; state assumptions explicitly where input is thin. Maximum ~1200 words.",
    "",
    "TEAM INPUT (JSON):",
    JSON.stringify(clean, null, 2)
  ].join("\n");
}

async function sendToClaude() {
  const errs = validate();
  if (errs.length) { toast("Missing: " + errs.join(" · "), true); return; }

  const btn = $("#btnSend");
  btn.disabled = true;
  $("#sec-output").hidden = false;
  const out = $("#output");
  out.innerHTML = '<div class="spinner">Deriving recommendation …</div>';
  out.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": localStorage.getItem(KEY_STORE),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [{ role: "user", content: buildPrompt() }]
      })
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error("API " + res.status + " — " + body.slice(0, 300));
    }
    const data = await res.json();
    lastRecommendation = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    out.innerHTML = renderMarkdown(lastRecommendation);
    toast("Recommendation ready — " + state.team);
  } catch (err) {
    out.innerHTML = '<div class="err">' + esc(err.message) + "<br><br>Check the API key in Connection, and that your network allows api.anthropic.com.</div>";
    toast("Send failed", true);
  } finally {
    btn.disabled = false;
  }
}
$("#btnSend").addEventListener("click", sendToClaude);

$("#btnDownloadMd").addEventListener("click", () => {
  if (!lastRecommendation) { toast("Nothing to download yet", true); return; }
  download(new Blob([lastRecommendation], { type: "text/markdown" }),
    "recommendation-" + state.team.toLowerCase() + ".md");
});

/* ---------- minimal markdown renderer (headings, bold, lists, tables, hr) ---------- */
function renderMarkdown(md) {
  const lines = md.split("\n");
  const html = [];
  let list = false, table = [];

  function flushTable() {
    if (!table.length) return;
    const rows = table.map(r => r.split("|").slice(1, -1).map(c => c.trim()));
    const sepIdx = rows.findIndex(r => r.every(c => /^:?-{2,}:?$/.test(c)));
    let out = "<table>";
    rows.forEach((r, i) => {
      if (i === sepIdx) return;
      const tag = (sepIdx > -1 && i < sepIdx) ? "th" : "td";
      out += "<tr>" + r.map(c => `<${tag}>${inline(c)}</${tag}>`).join("") + "</tr>";
    });
    html.push(out + "</table>");
    table = [];
  }
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`(.+?)`/g, "<code>$1</code>");
  }
  function closeList() { if (list) { html.push("</ul>"); list = false; } }

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (/^\s*\|.*\|\s*$/.test(line)) { closeList(); table.push(line.trim()); continue; }
    flushTable();
    if (/^###\s/.test(line)) { closeList(); html.push("<h3>" + inline(line.slice(4)) + "</h3>"); }
    else if (/^##\s/.test(line)) { closeList(); html.push("<h2>" + inline(line.slice(3)) + "</h2>"); }
    else if (/^#\s/.test(line)) { closeList(); html.push("<h2>" + inline(line.slice(2)) + "</h2>"); }
    else if (/^(\s*)[-*]\s+/.test(line)) {
      if (!list) { html.push("<ul>"); list = true; }
      html.push("<li>" + inline(line.replace(/^(\s*)[-*]\s+/, "")) + "</li>");
    }
    else if (/^-{3,}\s*$/.test(line)) { closeList(); html.push("<hr>"); }
    else if (line.trim() === "") { closeList(); }
    else { closeList(); html.push("<p>" + inline(line) + "</p>"); }
  }
  flushTable(); closeList();
  return html.join("\n");
}

/* ---------- misc ---------- */
let toastTimer;
function toast(msg, bad) {
  const el = $("#toast");
  el.textContent = msg;
  el.className = "toast" + (bad ? " bad" : "");
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}
function setSaveStatus(msg) { $("#saveStatus").textContent = msg; }

/* ---------- init ---------- */
$("#apiKey").value = localStorage.getItem(KEY_STORE) || "";
loadTeam(TEAMS[0]);
