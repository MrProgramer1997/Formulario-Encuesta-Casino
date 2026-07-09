const SUPABASE_URL = "https://bbgqhzejwvfxpkhpvtux.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZ3FoemVqd3ZmeHBraHB2dHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTY5ODUsImV4cCI6MjA5OTE5Mjk4NX0.W-PBiI9B6Y-t0ZUByp7BZi7J8lHJ27ObEliFu39-yck";

const supabaseAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const adminLogin = document.getElementById("adminLogin");
const adminContent = document.getElementById("adminContent");
const adminUserInput = document.getElementById("adminUser");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminLoginMsg = document.getElementById("adminLoginMsg");

const searchInput = document.getElementById("search");
const tableBody = document.getElementById("adminTableBody");
const adminSummary = document.getElementById("adminSummary");
const adminEmpty = document.getElementById("adminEmpty");
const downloadBtn = document.getElementById("downloadBtn");

let allRecords = [];
let currentRecords = [];
let loggedAdminUser = null;
let loggedAdminPassword = null;

const RATING_FIELDS = [
  ["sabor_calidad", "Sabor/calidad"],
  ["variedad_menu", "Variedad menú"],
  ["atencion_servicio", "Atención/servicio"],
  ["limpieza_higiene", "Limpieza/higiene"],
  ["tiempos_menu_especial", "Tiempos menú especial"],
  ["satisfaccion_general", "Satisfacción general"],
];

function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function avg(records, field) {
  if (!records.length) return 0;
  const sum = records.reduce((acc, r) => acc + safeNum(r[field]), 0);
  return sum / records.length;
}

function ratingLabel(value) {
  const labels = {
    1: "Muy insatisfecho",
    2: "Insatisfecho",
    3: "Ni satisfecho ni insatisfecho",
    4: "Satisfecho",
    5: "Muy satisfecho",
  };
  return labels[value] || "";
}

function setTextCell(tr, value) {
  const td = document.createElement("td");
  td.textContent = value ?? "";
  tr.appendChild(td);
}

function renderTable(records) {
  if (!tableBody || !adminEmpty) return;
  tableBody.innerHTML = "";

  if (!records.length) {
    adminEmpty.style.display = "block";
    return;
  }

  adminEmpty.style.display = "none";

  records.forEach((row) => {
    const tr = document.createElement("tr");
    setTextCell(tr, formatDate(row.created_at));
    setTextCell(tr, row.nombres || "");
    setTextCell(tr, row.apellidos || "");
    setTextCell(tr, row.documento || "");

    RATING_FIELDS.forEach(([field]) => {
      const value = row[field] ?? "";
      setTextCell(tr, value ? `${value} - ${ratingLabel(value)}` : "");
    });

    setTextCell(tr, row.sugerencia || "");
    setTextCell(tr, row.comentarios_adicionales || "");
    tableBody.appendChild(tr);
  });
}

function renderSummary(records) {
  if (!adminSummary) return;
  const total = records.length;
  const parts = RATING_FIELDS.map(([field, label]) => `${label}: ${avg(records, field).toFixed(2)}`);
  adminSummary.textContent = `Total respuestas: ${total} · Promedios (1-5) → ${parts.join(" · ")}`;
}

function applyFilter() {
  if (!allRecords.length) {
    renderTable([]);
    renderSummary([]);
    return;
  }

  const term = (searchInput?.value || "").trim().toLowerCase();

  if (!term) {
    currentRecords = allRecords.slice();
  } else {
    currentRecords = allRecords.filter((row) => {
      const haystack = [
        row.nombres,
        row.apellidos,
        row.documento,
        row.sugerencia,
        row.comentarios_adicionales,
      ].join(" ").toLowerCase();
      return haystack.includes(term);
    });
  }

  renderTable(currentRecords);
  renderSummary(currentRecords);
}

async function loadData() {
  if (adminSummary) adminSummary.textContent = "Cargando registros...";

  const { data, error } = await supabaseAdmin.rpc("get_casino_respuestas_admin", {
    p_username: loggedAdminUser,
    p_password: loggedAdminPassword,
  });

  if (error) {
    console.error("Error cargando registros:", error);
    if (adminSummary) adminSummary.textContent = "Error cargando registros. Revisa policies/RLS en Supabase.";
    renderTable([]);
    return;
  }

  allRecords = data || [];
  currentRecords = allRecords.slice();
  renderTable(currentRecords);
  renderSummary(currentRecords);
}

function exportToCsv() {
  const records = currentRecords.length ? currentRecords : allRecords;
  if (!records.length) {
    alert("No hay registros para exportar.");
    return;
  }

  const header = [
    "Fecha",
    "Nombres",
    "Apellidos",
    "Documento",
    "Sabor_Calidad",
    "Variedad_Menu",
    "Atencion_Servicio",
    "Limpieza_Higiene",
    "Tiempos_Menu_Especial",
    "Satisfaccion_General",
    "Sugerencia",
    "Comentarios_Adicionales",
  ];

  const clean = (v) => String(v ?? "").replace(/"/g, '""');

  const rows = records.map((r) => [
    formatDate(r.created_at),
    clean(r.nombres),
    clean(r.apellidos),
    clean(r.documento),
    clean(r.sabor_calidad),
    clean(r.variedad_menu),
    clean(r.atencion_servicio),
    clean(r.limpieza_higiene),
    clean(r.tiempos_menu_especial),
    clean(r.satisfaccion_general),
    clean(r.sugerencia),
    clean(r.comentarios_adicionales),
  ]);

  const csvLines = [header.join(";"), ...rows.map((cols) => cols.map((c) => `"${c}"`).join(";"))];
  const csvContent = csvLines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "respuestas_encuesta_casino.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function doLogin() {
  if (!adminUserInput || !adminPasswordInput || !adminLogin || !adminContent || !adminLoginMsg) {
    console.error("Elementos del login no encontrados en el DOM.");
    return;
  }

  const username = (adminUserInput.value || "").trim().toLowerCase();
  const password = adminPasswordInput.value || "";
  adminLoginMsg.textContent = "";

  if (!username || !password) {
    adminLoginMsg.textContent = "Por favor ingresa usuario y contraseña.";
    adminLoginMsg.style.color = "#b91c1c";
    return;
  }

  adminLoginBtn.disabled = true;
  adminLoginMsg.textContent = "Validando acceso...";
  adminLoginMsg.style.color = "#475569";

  const { data, error } = await supabaseAdmin.rpc("verify_admin_login", {
    p_username: username,
    p_password: password,
  });

  adminLoginBtn.disabled = false;

  if (error) {
    console.error("Error login admin:", error);
    adminLoginMsg.textContent = "Error validando acceso. Revisa la función verify_admin_login.";
    adminLoginMsg.style.color = "#b91c1c";
    return;
  }

  if (data !== true) {
    adminLoginMsg.textContent = "Usuario o contraseña incorrectos.";
    adminLoginMsg.style.color = "#b91c1c";
    return;
  }

  loggedAdminUser = username;
  loggedAdminPassword = password;
  adminLogin.style.display = "none";
  adminContent.style.display = "block";
  loadData();
}

if (adminLoginBtn) adminLoginBtn.addEventListener("click", doLogin);
if (adminPasswordInput) {
  adminPasswordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });
}
if (adminUserInput) {
  adminUserInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });
}
if (searchInput) searchInput.addEventListener("input", applyFilter);
if (downloadBtn) downloadBtn.addEventListener("click", exportToCsv);
