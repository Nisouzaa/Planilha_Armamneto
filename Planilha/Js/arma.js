// arma.js
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzg0g_0tRtcBkNtQSMxhXa2hDh5xi-GZLAfug_fYMx6890aNU1ZSywzs74ArXb30o4bPA/exec"

const params = new URLSearchParams(window.location.search);
const idParam = params.get("id");
const infoContent = document.getElementById("infoContent");
const infoBox = document.getElementById("infoBox");

function createFieldHtml(key, value) {
  return `<div class="field"><strong>${key}</strong><span>${
    value === "-" || value === "" ? "—" : value
  }</span></div>`;
}

async function loadArm() {
  if (!infoContent) return;
  if (!idParam) {
    infoContent.innerHTML = "<div class='field'>❌ Nenhum ID informado</div>";
    return;
  }

  try {
    infoBox.querySelector("h2").textContent = `Ficha — ID ${idParam}`;
    const res = await fetch(
      `${WEB_APP_URL}?action=get&id=${encodeURIComponent(idParam)}`
    );
    const json = await res.json();
    if (json.erro) {
      infoContent.innerHTML = `<div class='field'>❌ ${json.erro}</div>`;
      return;
    }

    const regs = json.registros || [];
    infoContent.innerHTML = "";

    // mostra QR na parte superior (apenas 1 QR para o ID, apontando para a ficha)
   const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(WEB_APP_URL + "?action=get&id=" + idParam)}`;


    const qrBox = document.createElement("div");
    qrBox.style.display = "flex";
    qrBox.style.justifyContent = "flex-end";
    qrBox.style.marginBottom = "8px";
    qrBox.innerHTML = `<div style="text-align:center"><img alt="QR" src="${qrUrl}" style="max-width:180px"><div style="font-size:12px;margin-top:6px">ID ${idParam}</div></div>`;
    infoContent.appendChild(qrBox);

    regs.forEach((r, idx) => {
      const container = document.createElement("div");
      container.style.marginBottom = "8px";
      container.innerHTML =
        `<div style="font-weight:700;color:var(--accent);margin-bottom:6px">Registro ${
          idx + 1
        }</div>` +
        Object.keys(r)
          .map((k) => createFieldHtml(k, r[k]))
          .join("");
      infoContent.appendChild(container);
    });

    // se não houver registros
    if (regs.length === 0) {
      infoContent.innerHTML +=
        "<div class='field'>Nenhum registro encontrado para este ID.</div>";
    }
  } catch (e) {
    infoContent.innerHTML = `<div class='field'>⚠ Erro ao carregar: ${e.message}</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadArm();

  const pb = document.getElementById("printBtn");
  if (pb) pb.addEventListener("click", () => window.print());
});
