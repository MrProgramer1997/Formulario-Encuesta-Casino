const SUPABASE_URL = "https://bbgqhzejwvfxpkhpvtux.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZ3FoemVqd3ZmeHBraHB2dHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTY5ODUsImV4cCI6MjA5OTE5Mjk4NX0.W-PBiI9B6Y-t0ZUByp7BZi7J8lHJ27ObEliFu39-yck";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("finAnioForm");
const messagesBox = document.getElementById("messages");
const submitBtn = document.getElementById("submitBtn");
const questionsContainer = document.getElementById("questionsContainer");

const successModal = document.getElementById("successModal");
const modalNameEl = document.getElementById("modalName");
const modalCloseBtn = document.getElementById("modalCloseBtn");

const STORAGE_KEY = "encuestaCasinoServicioColaboradores_v1";

const RATING_OPTIONS = [
  { value: 1, title: "Muy insatisfecho", text: "Muy bajo", icon: "😕" },
  { value: 2, title: "Insatisfecho", text: "Debe mejorar", icon: "🙁" },
  { value: 3, title: "Ni satisfecho ni insatisfecho", text: "Normal", icon: "😐" },
  { value: 4, title: "Satisfecho", text: "Bueno", icon: "🙂" },
  { value: 5, title: "Muy satisfecho", text: "Excelente", icon: "😋" },
];

const QUESTIONS = [
  {
    field: "sabor_calidad",
    label: "🍲 ¿Qué tan satisfecho(a) estás con el sabor y la calidad de los alimentos?",
  },
  {
    field: "variedad_menu",
    label: "📋 ¿Cómo calificas la variedad del menú que se ofrece?",
  },
  {
    field: "atencion_servicio",
    label: "🤝 ¿Qué tan satisfecho(a) estás con la atención y el servicio brindado por el personal del casino?",
  },
  {
    field: "limpieza_higiene",
    label: "🧼 ¿Cómo calificas la limpieza e higiene del casino y de los utensilios?",
  },
  {
    field: "tiempos_menu_especial",
    label: "⏱️ Qué tan satisfecho(a) estas con los tiempos de entrega del menú especial?",
  },
  {
    field: "satisfaccion_general",
    label: "⭐ En términos generales, ¿qué tan satisfecho(a) estás con el servicio del casino de colaboradores?",
  },
];

function renderQuestions() {
  if (!questionsContainer) return;

  questionsContainer.innerHTML = QUESTIONS.map((question) => {
    const options = RATING_OPTIONS.map((option) => `
      <label class="option-card option-rating">
        <input type="radio" name="${question.field}" value="${option.value}" required />
        <div class="option-inner">
          <div class="option-header">
            <div class="option-icon-wrap food">
              <span class="icon-main">${option.icon}</span>
              <span class="icon-badge">${option.value}</span>
            </div>
            <div class="option-texts">
              <h3>${option.title}</h3>
              <p>${option.text}</p>
            </div>
          </div>
        </div>
      </label>
    `).join("");

    return `
      <div class="field field-full">
        <label class="label-block">${question.label}</label>
        <div class="options-grid rating-grid" data-group="${question.field}">
          ${options}
        </div>
      </div>
    `;
  }).join("");
}

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

function setSubmitting(isSubmitting) {
  if (!form || !submitBtn) return;

  if (isSubmitting) {
    form.classList.add("disabled");
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
  } else {
    form.classList.remove("disabled");
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
}

function setSurveyCompleted() {
  if (!form || !submitBtn) return;

  form.classList.add("disabled");
  submitBtn.classList.remove("loading");
  submitBtn.disabled = true;

  const defaultText = submitBtn.querySelector(".btn-text-default");
  const loadingText = submitBtn.querySelector(".btn-text-loading");

  if (defaultText) defaultText.textContent = "Encuesta enviada";
  if (loadingText) loadingText.textContent = "Enviada";
}

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

document.addEventListener("click", (e) => {
  const card = e.target.closest(".option-card");
  if (!card) return;

  const radio = card.querySelector('input[type="radio"]');
  if (!radio) return;

  radio.checked = true;

  const grid = card.closest(".options-grid");
  if (grid) {
    grid.querySelectorAll(".option-card.selected").forEach((c) => c.classList.remove("selected"));
  }

  card.classList.add("selected");
});

function checkAlreadyRegisteredLocal() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function markRegisteredLocal() {
  localStorage.setItem(STORAGE_KEY, "1");
}

function getRatingValue(fieldName) {
  const radio = form.querySelector(`input[name="${fieldName}"]:checked`);
  return radio ? Number(radio.value) : null;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nombres = form.nombres.value.trim();
  const apellidos = form.apellidos.value.trim();
  const documento = form.documento.value.trim();
  const sugerencia = (form.sugerencia?.value || "").trim();
  const comentarios_adicionales = (form.comentarios_adicionales?.value || "").trim();

  if (!nombres || !apellidos) {
    showMessage("error", "Por favor completa tus nombres y apellidos.");
    return;
  }

  if (!documento) {
    showMessage("error", "Por favor ingresa tu número de documento.");
    return;
  }

  const ratings = {};
  for (const question of QUESTIONS) {
    const value = getRatingValue(question.field);
    if (!value) {
      showMessage("error", "Por favor responde todas las preguntas (calificación 1 a 5).");
      return;
    }
    ratings[question.field] = value;
  }

  if (checkAlreadyRegisteredLocal()) {
    showMessage("error", "Ya enviaste la encuesta desde este dispositivo. Si crees que es un error, comunícate con sistemas.");
    return;
  }

  setSubmitting(true);
  showMessage("success", "Enviando tu encuesta...");

  try {
    const { error } = await supabaseClient
      .from("encuesta_casino")
      .insert([{
        nombres,
        apellidos,
        documento,
        ...ratings,
        sugerencia: sugerencia || null,
        comentarios_adicionales: comentarios_adicionales || null,
      }]);

    if (error) {
      console.error("Error Supabase:", error);
      if (error.code === "23505") {
        showMessage("error", "Ya registraste una respuesta con este documento. No es necesario enviar otra.");
      } else {
        showMessage("error", "Ocurrió un error al guardar la encuesta. Intenta nuevamente o comunícate con sistemas.");
      }
      setSubmitting(false);
      return;
    }

    markRegisteredLocal();
    const nombreCompleto = `${nombres} ${apellidos}`;
    showMessage("success", "✅ Gracias, has diligenciado la encuesta correctamente.");
    form.reset();
    document.querySelectorAll(".option-card.selected").forEach((c) => c.classList.remove("selected"));
    setSurveyCompleted();
    openSuccessModal(nombreCompleto);
  } catch (err) {
    console.error(err);
    showMessage("error", "Ocurrió un error inesperado. Intenta nuevamente o comunícate con sistemas.");
    setSubmitting(false);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  renderQuestions();

  if (checkAlreadyRegisteredLocal()) {
    showMessage("success", "Ya enviaste la encuesta desde este dispositivo.");
    setSurveyCompleted();
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeSuccessModal);
  if (successModal) {
    successModal.addEventListener("click", (e) => {
      if (e.target === successModal) closeSuccessModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSuccessModal();
  });
});
