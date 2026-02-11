// js/admin.js

const SUPABASE_URL = "https://owhecfljtxuqbkeamsaz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93aGVjZmxqdHh1cWJrZWFtc2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzE0NzAsImV4cCI6MjA4NjQwNzQ3MH0.5WcwCwsFw6YgNhO8dzlYahFsSeVr6nBC6ZuCEeg33A4"
const supabaseAdmin = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Contraseña del panel admin
const ADMIN_PASSWORD = "Club2026*";

// Elementos de login
const adminLogin = document.getElementById("adminLogin");
const adminContent = document.getElementById("adminContent");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminLoginMsg = document.getElementById("adminLoginMsg");

// Elementos del panel
const searchInput = document.getElementById("search");
const tableBody = document.getElementById("adminTableBody");
const adminSummary = document.getElementById("adminSummary");
const adminEmpty = document.getElementById("adminEmpty");
const downloadBtn = document.getElementById("downloadBtn");

let allRecords = [];
let currentRecords = [];

/* --------------------------- UTILIDADES --------------------------- */

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

    const tdFecha = document.createElement("td");
    tdFecha.textContent = formatDate(row.created_at);

    const tdNom = document.createElement("td");
    tdNom.textContent = row.nombres || "";

    const tdApe = document.createElement("td");
    tdApe.textContent = row.apellidos || "";

    const tdDoc = document.createElement("td");
    tdDoc.textContent = row.documento || "";

    const tdSabor = document.createElement("td");
    tdSabor.textContent = row.sabor ?? "";

    const tdMenu = document.createElement("td");
    tdMenu.textContent = row.menu ?? "";

    const tdFreq = document.createElement("td");
    tdFreq.textContent = row.frecuencia_rotacion ?? "";

    const tdSalud = document.createElement("td");
    tdSalud.textContent = row.opciones_saludables ?? "";

    const tdSug = document.createElement("td");
    tdSug.textContent = row.sugerencia || "";

    tr.appendChild(tdFecha);
    tr.appendChild(tdNom);
    tr.appendChild(tdApe);
    tr.appendChild(tdDoc);
    tr.appendChild(tdSabor);
    tr.appendChild(tdMenu);
    tr.appendChild(tdFreq);
    tr.appendChild(tdSalud);
    tr.appendChild(tdSug);

    tableBody.appendChild(tr);
  });
}

function renderSummary(records) {
  if (!adminSummary) return;

  const total = records.length;
  const aSabor = avg(records, "sabor");
  const aMenu = avg(records, "menu");
  const aFreq = avg(records, "frecuencia_rotacion");
  const aSalud = avg(records, "opciones_saludables");

  adminSummary.textContent =
    `Total respuestas: ${total} · Promedios (1-5) → ` +
    `Sabor: ${aSabor.toFixed(2)} · Menú: ${aMenu.toFixed(2)} · ` +
    `Rotación: ${aFreq.toFixed(2)} · Saludables: ${aSalud.toFixed(2)}`;
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
      const nom = (row.nombres || "").toLowerCase();
      const ape = (row.apellidos || "").toLowerCase();
      const doc = (row.documento || "").toLowerCase();
      const sug = (row.sugerencia || "").toLowerCase();
      return nom.includes(term) || ape.includes(term) || doc.includes(term) || sug.includes(term);
    });
  }

  renderTable(currentRecords);
  renderSummary(currentRecords);
}

async function loadData() {
  if (adminSummary) {
    adminSummary.textContent = "Cargando registros...";
  }

  const { data, error } = await supabaseAdmin
    .from("encuesta_casino")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando registros:", error);
    if (adminSummary) {
      adminSummary.textContent =
        "Error cargando registros. Revisa consola o credenciales/policies.";
    }
    renderTable([]);
    return;
  }

  allRecords = data || [];
  currentRecords = allRecords.slice();
  renderTable(currentRecords);
  renderSummary(currentRecords);
}

// Exportar a CSV
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
    "Sabor",
    "Menu",
    "Frecuencia_Rotacion",
    "Opciones_Saludables",
    "Sugerencia",
  ];

  const rows = records.map((r) => [
    formatDate(r.created_at),
    (r.nombres || "").replace(/"/g, '""'),
    (r.apellidos || "").replace(/"/g, '""'),
    (r.documento || "").replace(/"/g, '""'),
    String(r.sabor ?? "").replace(/"/g, '""'),
    String(r.menu ?? "").replace(/"/g, '""'),
    String(r.frecuencia_rotacion ?? "").replace(/"/g, '""'),
    String(r.opciones_saludables ?? "").replace(/"/g, '""'),
    (r.sugerencia || "").replace(/"/g, '""'),
  ]);

  const csvLines = [
    header.join(";"),
    ...rows.map((cols) => cols.map((c) => `"${c}"`).join(";")),
  ];

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

/* --------------------------- LOGIN --------------------------- */

function doLogin() {
  if (!adminPasswordInput || !adminLogin || !adminContent || !adminLoginMsg) {
    console.error("Elementos del login no encontrados en el DOM.");
    return;
  }

  const pass = (adminPasswordInput.value || "").trim();
  adminLoginMsg.textContent = "";

  if (!pass) {
    adminLoginMsg.textContent = "Por favor ingresa la contraseña.";
    adminLoginMsg.style.color = "#b91c1c";
    return;
  }

  if (pass !== ADMIN_PASSWORD) {
    adminLoginMsg.textContent = "Contraseña incorrecta.";
    adminLoginMsg.style.color = "#b91c1c";
    return;
  }

  adminLogin.style.display = "none";
  adminContent.style.display = "block";
  loadData();
}

/* ------------------------ EVENTOS ------------------------ */

if (adminLoginBtn) adminLoginBtn.addEventListener("click", doLogin);

if (adminPasswordInput) {
  adminPasswordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });
}

if (searchInput) searchInput.addEventListener("input", applyFilter);

if (downloadBtn) downloadBtn.addEventListener("click", exportToCsv);
