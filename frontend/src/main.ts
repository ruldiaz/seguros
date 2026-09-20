import "./styles.css";

const successMessages: Record<string, string> = {
  "quick-quote": "Gracias. Recibimos tu solicitud y te contactaremos pronto.",
  "full-quote": "Solicitud enviada. Te contactaremos con opciones actualizadas.",
};

const pendingMessages: Record<string, string> = {
  "quick-quote": "Enviando cotizacion rapida...",
  "full-quote": "Enviando solicitud...",
};

const setStatus = (formName: string, message: string, state: "idle" | "success" | "error" = "idle") => {
  const status = document.querySelector<HTMLElement>(`[data-status-for="${formName}"]`);
  if (!status) return;

  status.textContent = message;
  status.dataset.state = state;
};

const encodeForm = (form: HTMLFormElement) => {
  const formData = new FormData(form);
  return new URLSearchParams(formData as unknown as Record<string, string>).toString();
};

const bindNetlifyForm = (form: HTMLFormElement) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formName = form.getAttribute("name") ?? "";
    if (!formName) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus(formName, "Revisa los campos marcados.", "error");
      return;
    }

    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    submitButton?.setAttribute("disabled", "true");
    setStatus(formName, pendingMessages[formName] ?? "Enviando...", "idle");

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeForm(form),
      });

      if (!response.ok) {
        throw new Error(`Netlify response ${response.status}`);
      }

      form.reset();
      setStatus(formName, successMessages[formName] ?? "Formulario enviado.", "success");
    } catch (error) {
      console.error(error);
      setStatus(formName, "No se pudo enviar. Llamanos o intenta de nuevo.", "error");
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });
};

document.querySelectorAll<HTMLFormElement>("form[data-netlify]").forEach(bindNetlifyForm);

const year = document.querySelector<HTMLElement>("[data-year]");
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const menuToggle = document.querySelector<HTMLButtonElement>(".menu-toggle");
const navMenu = document.querySelector<HTMLElement>("#nav-menu");

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  navMenu?.toggleAttribute("data-open", !isOpen);
});

navMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    navMenu?.removeAttribute("data-open");
  });
});
