import "./styles.css";

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
