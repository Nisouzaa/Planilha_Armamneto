// dashboard.js
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxg8BIA9AgdWm6I4gN0Mh7hYc-jm2SIW5cisXgruMBBpc5F2b7jCabcak5to9LBLqULTw/exec";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

async function fetchStats() {
  const res = await fetch(`${WEB_APP_URL}?action=stats`);
  return await res.json();
}
async function fetchRecentRecords(limit = 20) {
  // não há endpoint "recent" — vamos buscar stats + read sheet (hack: call stats + then call get for each ID)
  const st = await fetchStats();
  // montar array de IDs ordenados por tiros desc
  const ids =
    st.stats && st.stats.summary ? st.stats.summary.map((s) => s.ID) : [];
  const records = [];
  for (let id of ids.slice(0, limit)) {
    const r = await fetch(
      `${WEB_APP_URL}?action=get&id=${encodeURIComponent(id)}`
    );
    const json = await r.json();
    if (json.registros) records.push(...json.registros);
  }
  return records.slice(0, limit);
}

function renderStats(statsObj) {
  const tirosList = $("#tirosList");
  const maintList = $("#maintList");
  tirosList.innerHTML = "";
  maintList.innerHTML = "";

  const summary = statsObj.stats.summary || [];
  // ordenar por totalTiros desc
  summary.sort((a, b) => (b.totalTiros || 0) - (a.totalTiros || 0));
  for (const s of summary.slice(0, 30)) {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<div>ID ${s.ID}</div><div>${
      s.totalTiros || 0
    } tiros</div>`;
    tirosList.appendChild(row);

    const row2 = document.createElement("div");
    row2.className = "row";
    row2.innerHTML = `<div>ID ${s.ID}</div><div>${
      s.lastMaintenance || "—"
    }</div>`;
    maintList.appendChild(row2);
  }
}

function renderRecords(list) {
  const container = $("#recordsList");
  container.innerHTML = "";
  if (!list || list.length === 0) {
    container.innerHTML =
      "<div class='recordItem'>Nenhum registro encontrado</div>";
    return;
  }
  for (const r of list) {
    const el = document.createElement("div");
    el.className = "recordItem";
    el.innerHTML = `<div><strong>${r["Armamento"] || "—"} ${
      r["Modelo"] || ""
    } — Nº ${r["Nº"] || "—"}</strong></div>
                    <div>ID: ${r["ID"]} • Dono: ${r["Dono"] || "—"} • Tiros: ${
      r["Quantidade de tiros"] || "—"
    }</div>
                    <div>Peças: ${r["Peças quebradas"] || "—"} • Manutenção: ${
      r["Data da última manutenção"] || "—"
    } • Resp: ${r["Responsável pela manutenção"] || "—"}</div>
                    <div style="margin-top:6px"><a target="_blank" href="./arma.html?id=${encodeURIComponent(
                      r["ID"]
                    )}">Abrir ficha / QR</a></div>`;
    container.appendChild(el);
  }
}

async function refreshAll() {
  try {
    $("#refreshBtn").disabled = true;
    const stats = await fetchStats();
    renderStats(stats);
    const recs = await fetchRecentRecords(25);
    renderRecords(recs);
  } catch (e) {
    console.error(e);
  } finally {
    $("#refreshBtn").disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refreshAll();
  $("#refreshBtn").addEventListener("click", refreshAll);
  $("#searchInput").addEventListener("keydown", async (ev) => {
    if (ev.key === "Enter") {
      const q = ev.target.value.trim().toLowerCase();
      if (!q) return refreshAll();
      // search by calling stats then filter
      const stats = await fetchStats();
      const ids = (stats.stats.summary || []).map((s) => s.ID);
      const foundRecords = [];
      for (const id of ids) {
        const res = await fetch(
          `${WEB_APP_URL}?action=get&id=${encodeURIComponent(id)}`
        );
        const json = await res.json();
        if (json.registros) {
          for (const r of json.registros) {
            if (Object.values(r).join(" ").toLowerCase().includes(q))
              foundRecords.push(r);
          }
        }
      }
      renderRecords(foundRecords.slice(0, 50));
    }
  });
});


// Garador de QR
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



// https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://script.google.com/macros/s/AKfycbxg8BIA9AgdWm6I4gN0Mh7hYc-jm2SIW5cisXgruMBBpc5F2b7jCabcak5to9LBLqULTw/exec