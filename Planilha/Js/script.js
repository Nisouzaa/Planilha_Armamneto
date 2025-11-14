// arma.js
const WEB_APP_URL ="https://script.google.com/macros/s/AKfycbxg8BIA9AgdWm6I4gN0Mh7hYc-jm2SIW5cisXgruMBBpc5F2b7jCabcak5to9LBLqULTw/exec";

const params = new URLSearchParams(window.location.search);
const idParam = params.get("id");
const infoContent = document.getElementById("infoContent");
const infoBox = document.getElementById("infoBox");

async function loadArm() {
  if (!idParam) {
    infoContent.innerHTML = "<div class='field'>❌ Nenhum ID informado</div>";
    return;
  }
  try {
    const res = await fetch(
      `${WEB_APP_URL}?action=get&id=${encodeURIComponent(idParam)}`
    );
    const json = await res.json();
    if (json.erro) {
      infoContent.innerHTML = `<div class='field'>❌ ${json.erro}</div>`;
      return;
    }
    const regs = json.registros;
    infoContent.innerHTML = "";
    regs.forEach((r, idx) => {
      const container = document.createElement("div");
      container.style.marginBottom = "8px";
      container.innerHTML =
        `<div style="font-weight:700;color:var(--accent);margin-bottom:6px">Registro ${
          idx + 1
        }</div>` +
        Object.keys(r)
          .map(
            (k) =>
              `<div class="field"><strong>${k}</strong><span>${
                r[k] === "-" || r[k] === "" ? "—" : r[k]
              }</span></div>`
          )
          .join("");
      infoContent.appendChild(container);
    });
  } catch (e) {
    infoContent.innerHTML = `<div class='field'>⚠ Erro ao carregar: ${e.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadArm();
  const pb = document.getElementById("printBtn");
  if (pb) pb.addEventListener("click", () => window.print());
});
