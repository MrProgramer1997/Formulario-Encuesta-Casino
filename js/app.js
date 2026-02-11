// js/app.js

// 1. Configuración de Supabase
const SUPABASE_URL = "https://owhecfljtxuqbkeamsaz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93aGVjZmxqdHh1cWJrZWFtc2F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MzE0NzAsImV4cCI6MjA4NjQwNzQ3MH0.5WcwCwsFw6YgNhO8dzlYahFsSeVr6nBC6ZuCEeg33A4";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 2. Selectores
const form = document.getElementById("finAnioForm");
const messagesBox = document.getElementById("messages");
const submitBtn = document.getElementById("submitBtn");

// Modal
const successModal = document.getElementById("successModal");
const modalNameEl = document.getElementById("modalName");
const modalCloseBtn = document.getElementById("modalCloseBtn");

// Cambiamos la key local para que NO choque con el formulario anterior
const STORAGE_KEY = "encuestaCasinoRegistrada_v1";

/* --------------------------- UTILIDADES UI --------------------------- */

function showMessage(type, text) {
  messagesBox.innerHTML = "";
  if (!text) return;

  const div = document.createElement("div");
  div.classList.add("message");
  if (type === "success") div.classList.add("message-success");
  if (type === "error") div.classList.add("message-error");

  const iconSpan = document.createElement("span");
  iconSpan.classList.add("icon");
  iconSpan.textContent = type === "success" ? "✅" : "⚠️";

  const textSpan = document.createElement("span");
  textSpan.textContent = text;

  div.appendChild(iconSpan);
  div.appendChild(textSpan);
  messagesBox.appendChild(div);
}

function setFormDisabled(disabled) {
  if (disabled) {
    form.classList.add("disabled");
    submitBtn.classList.add("loading");
  } else {
    form.classList.remove("disabled");
    submitBtn.classList.remove("loading");
  }
}

/* ------------------------------ MODAL ------------------------------ */

function openSuccessModal(nombreCompleto) {
  if (!successModal) return;
  modalNameEl.textContent = nombreCompleto;
  successModal.classList.add("open");
  successModal.setAttribute("aria-hidden", "false");
}

function closeSuccessModal() {
  if (!successModal) return;
  successModal.classList.remove("open");
  successModal.setAttribute("aria-hidden", "true");
}

/* --------------------------- SELECCIÓN TARJETAS --------------------------- */
/**
 * Antes: solo permitía 1 selección global (evento).
 * Ahora: hay varias preguntas, cada una con 5 opciones.
 * Solución: el "selected" se aplica SOLO dentro del grid del grupo.
 */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".option-card");
  if (!card) return;

  const radio = card.querySelector('input[type="radio"]');
  if (!radio) return;

  radio.checked = true;

  const grid = card.closest(".options-grid");
  if (grid) {
    grid
      .querySelectorAll(".option-card.selected")
      .forEach((c) => c.classList.remove("selected"));
  }

  card.classList.add("selected");
});

/* --------------------------- REGISTRO LOCAL --------------------------- */

function checkAlreadyRegisteredLocal() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function markRegisteredLocal() {
  localStorage.setItem(STORAGE_KEY, "1");
}

/* --------------------------- ENVÍO FORMULARIO --------------------------- */

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nombres = form.nombres.value.trim();
  const apellidos = form.apellidos.value.trim();
  const documento = form.documento.value.trim();
  const sugerencia = (form.sugerencia?.value || "").trim();

  const saborRadio = form.querySelector('input[name="sabor"]:checked');
  const menuRadio = form.querySelector('input[name="menu"]:checked');
  const freqRadio = form.querySelector('input[name="frecuencia_rotacion"]:checked');
  const saludRadio = form.querySelector('input[name="opciones_saludables"]:checked');

  if (!nombres || !apellidos) {
    showMessage("error", "Por favor completa tus nombres y apellidos.");
    return;
  }

  if (!documento) {
    showMessage("error", "Por favor ingresa tu número de documento.");
    return;
  }

  if (!saborRadio || !menuRadio || !freqRadio || !saludRadio) {
    showMessage("error", "Por favor responde todas las preguntas (calificación 1 a 5).");
    return;
  }

  // Validación local (evita doble envío en el mismo navegador)
  if (checkAlreadyRegisteredLocal()) {
    showMessage(
      "error",
      "Ya enviaste la encuesta desde este dispositivo. Si crees que es un error, comunícate con sistemas."
    );
    return;
  }

  const sabor = Number(saborRadio.value);
  const menu = Number(menuRadio.value);
  const frecuencia_rotacion = Number(freqRadio.value);
  const opciones_saludables = Number(saludRadio.value);

  setFormDisabled(true);
  showMessage("success", "Enviando tu encuesta...");

  try {
    const { error } = await supabaseClient
      .from("encuesta_casino")
      .insert([
        {
          nombres,
          apellidos,
          documento,
          sabor,
          menu,
          frecuencia_rotacion,
          opciones_saludables,
          sugerencia: sugerencia || null,
        },
      ]);

    if (error) {
      console.error("Error Supabase:", error);

      // Duplicado por unique(documento)
      if (error.code === "23505") {
        showMessage(
          "error",
          "Ya registraste una respuesta con este documento. No es necesario enviar otra."
        );
      } else {
        showMessage(
          "error",
          "Ocurrió un error al guardar la encuesta. Intenta nuevamente o comunícate con sistemas."
        );
      }

      setFormDisabled(false);
      return;
    }

    // Éxito
    markRegisteredLocal();
    const nombreCompleto = `${nombres} ${apellidos}`;

    showMessage("success", "✅ ¡Encuesta enviada correctamente! Gracias por tu opinión.");

    // Limpiar UI
    form.reset();
    document
      .querySelectorAll(".option-card.selected")
      .forEach((c) => c.classList.remove("selected"));

    setFormDisabled(true);
    openSuccessModal(nombreCompleto);
  } catch (err) {
    console.error(err);
    showMessage(
      "error",
      "Ocurrió un error inesperado. Intenta nuevamente o comunícate con sistemas."
    );
    setFormDisabled(false);
  }
});

/* --------------------------- CARGA INICIAL --------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  if (checkAlreadyRegisteredLocal()) {
    showMessage("success", "Ya enviaste la encuesta desde este dispositivo.");
    setFormDisabled(true);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeSuccessModal);
  }

  if (successModal) {
    successModal.addEventListener("click", (e) => {
      if (e.target === successModal) closeSuccessModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSuccessModal();
  });
});
