// dashboard.js
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzg0g_0tRtcBkNtQSMxhXa2hDh5xi-GZLAfug_fYMx6890aNU1ZSywzs74ArXb30o4bPA/exec";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// --------- API -----------

async function fetchStats() {
  const res = await fetch(`${WEB_APP_URL}?action=stats`);
  return await res.json();
}

async function fetchById(id) {
  const res = await fetch(
    `${WEB_APP_URL}?action=get&id=${encodeURIComponent(id)}`
  );
  return await res.json();
}

async function fetchRecentRecords(limit = 20) {
  const st = await fetchStats();
  const ids = st.stats?.summary?.map((s) => s.ID) || [];
  const records = [];
  for (let id of ids.slice(0, limit)) {
    const json = await fetchById(id);
    if (json.registros) records.push(...json.registros);
    if (records.length >= limit) break;
  }
  return records.slice(0, limit);
}

// ---------- Renderização ----------

function renderStats(statsObj) {
  const tirosList = $("#tirosList");
  const maintList = $("#maintList");
  tirosList.innerHTML = "";
  maintList.innerHTML = "";

  const summary = statsObj.stats.summary || [];
  summary.sort((a, b) => (b.totalTiros || 0) - (a.totalTiros || 0));

  for (const s of summary.slice(0, 30)) {
    tirosList.innerHTML += `
      <div class="row"><div>ID ${s.ID}</div><div>${s.totalTiros} tiros</div></div>
    `;
    maintList.innerHTML += `
      <div class="row"><div>ID ${s.ID}</div><div>${
      s.lastMaintenance || "—"
    }</div></div>
    `;
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
  list.forEach((r) => {
    container.innerHTML += `
      <div class="recordItem">
        <strong>${r["Armamento"] || "—"} ${r["Modelo"] || ""} — Nº ${
      r["Nº"] || "—"
    }</strong>
        <div>ID: ${r["ID"]} • Dono: ${r["Dono"] || "—"} • Tiros: ${
      r["Quantidade de tiros"] || "—"
    }</div>
        <div>Peças: ${r["Peças quebradas"] || "—"} • Manutenção: ${
      r["Data da última manutenção"] || "—"
    } • Resp: ${r["Responsável pela manutenção"] || "—"}</div>
        <div style="margin-top:6px"><a target="_blank" href="./arma.html?id=${encodeURIComponent(
          r["ID"]
        )}">Abrir ficha / QR</a></div>
      </div>
    `;
  });
}

//---------- Atualização Completa ----------

async function refreshAll() {
  try {
    $("#refreshBtn").disabled = true;
    const stats = await fetchStats();
    renderStats(stats);
    const recs = await fetchRecentRecords(25);
    renderRecords(recs);
  } catch (e) {
    console.error(e);
    $(
      "#recordsList"
    ).innerHTML = `<div class="recordItem">Erro: ${e.message}</div>`;
  } finally {
    $("#refreshBtn").disabled = false;
  }
}

//--------- Eventos ----------

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado!");

  const refreshBtn = $("#refreshBtn");
  console.log("refreshBtn:", refreshBtn);

  if (refreshBtn) refreshBtn.addEventListener("click", refreshAll);

  const searchInput = $("#searchInput");
  console.log("searchInput:", searchInput);

  if (searchInput) {
    searchInput.addEventListener("keydown", async (ev) => {
      if (ev.key !== "Enter") return;

      ev.preventDefault();
      const q = ev.target.value.trim().toLowerCase();
      console.log("Busca por:", q);

      if (!q) return refreshAll();

      const stats = await fetchStats();
      const ids = stats.stats?.summary?.map(s => s.ID) || [];

      const found = [];
      for (const id of ids) {
        const json = await fetchById(id);
        if (!json?.registros) continue;

        for (const r of json.registros) {
          if (Object.values(r).join(" ").toLowerCase().includes(q)) {
            found.push(r);
            if (found.length >= 50) break;
          }
        }
      }
      renderRecords(found);
    });
  }

  refreshAll();
});
