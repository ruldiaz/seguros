import "./styles.css";

const trackingParams = new URLSearchParams(window.location.search);
const trackingValues: Record<string, string> = {
  utm_source: trackingParams.get("utm_source") ?? "",
  utm_medium: trackingParams.get("utm_medium") ?? "",
  utm_campaign: trackingParams.get("utm_campaign") ?? "",
  landing_page: window.location.href,
  created_at: new Date().toISOString(),
};

document.querySelectorAll<HTMLInputElement>("[data-tracking-field]").forEach((input) => {
  const field = input.dataset.trackingField;
  if (!field) return;

  if (field === "source") {
    input.value = input.value || "landing";
    return;
  }

  input.value = trackingValues[field] ?? "";
});

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

const productButtons = document.querySelectorAll<HTMLElement>("[data-product-target]");
const needCards = document.querySelectorAll<HTMLElement>(".need-card");
const productSelect = document.querySelector<HTMLSelectElement>("#product-interest");
const autoFields = document.querySelector<HTMLFieldSetElement>("[data-auto-fields]");
const autoRequiredFields = document.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-auto-required]");

const updateProductFields = (product: string) => {
  const isAuto = product === "auto";
  if (autoFields) {
    autoFields.hidden = !isAuto;
  }

  autoRequiredFields.forEach((field) => {
    field.disabled = !isAuto;
    field.required = isAuto;
  });
};

productButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const target = button.dataset.productTarget;
    if (!target || !productSelect) return;

    needCards.forEach((card) => card.classList.toggle("is-active", card === button));
    productSelect.value = target;
    updateProductFields(target);

    document.querySelector("#lead-interest")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});

productSelect?.addEventListener("change", () => {
  const product = productSelect.value;
  updateProductFields(product);
  needCards.forEach((card) => card.classList.toggle("is-active", card.dataset.productTarget === product));
});

if (productSelect) {
  updateProductFields(productSelect.value);
}
