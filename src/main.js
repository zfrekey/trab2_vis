import "./shared/styles/style.css";
import {
  getActorDetail,
  getActorOrigins,
  getFocusSummary,
  getOutcomeComposition,
  getRanking,
  getSites,
  getSummary,
  getTimeline,
} from "./data/launchesRepository.js";
import { getState, setState, subscribe } from "./state/store.js";
import {
  drawDetailChart,
  drawFocusMetrics,
  drawFocusSummary,
  drawMap,
  drawOutcomeComposition,
  drawRanking,
  drawTimeline,
} from "./views/charts.js";

const app = document.querySelector("#app");
app.innerHTML = `
  <header class="site-header">
    <div class="header-inner">
      <div class="brand">
        <p class="eyebrow">Visualização de dados · Trabalho 02</p>
        <h1>Órbita: uma história em lançamentos</h1>
        <p>Da corrida espacial à era comercial · UFF · Filype Abreu, Felipe Gomes e Lucas Paixão</p>
      </div>
      <div class="header-actions">
        <button class="button" id="about-open" type="button">Sobre os dados</button>
      </div>
    </div>
  </header>
  <main>
    <div class="status-bar" aria-live="polite">
      <span id="filter-summary">Carregando os dados históricos…</span>
    </div>
    <section class="dashboard-grid" aria-label="Painel interativo de lançamentos orbitais">
      <article class="card card-timeline">
        <div class="card-heading timeline-heading">
          <div>
            <p class="eyebrow">Panorama histórico</p>
            <h2>O ritmo de lançamento muda com o tempo</h2>
            <p class="card-description">Quem puxou cada era — e quando o volume de lançamentos acelerou?</p>
          </div>
          <div class="color-switch timeline-color-switch" role="group" aria-label="Colorir linha do tempo por">
            <button type="button" data-color-by="actor" aria-pressed="true">Quem lança</button>
            <button type="button" data-color-by="sector" aria-pressed="false">Que setor</button>
          </div>
        </div>
        <div class="chart" id="timeline-chart"><div class="loading-state">Preparando a linha do tempo…</div></div>
        <ul class="timeline-legend" aria-label="Legenda e seleção de atores"></ul>
        <p class="chart-note">Arraste na série para filtrar os anos. Clique na legenda para selecionar um ator ou setor e coordenar as views. O eixo Y começa em zero.</p>
      </article>
      <article class="card card-detail">
        <p class="eyebrow">Leitura em foco</p>
        <h2>Ator e setor, em detalhe</h2>
        <div class="detail-focus-columns">
          <section class="detail-focus" id="actor-focus" aria-label="Ator em foco"></section>
          <section class="detail-focus" id="sector-focus" aria-label="Setor em foco"></section>
        </div>
        <p class="detail-period" id="detail-period"></p>
        <div class="detail-chart" id="actor-detail-chart">
          <div class="detail-empty">Selecione um ator para ver o ritmo anual.</div>
        </div>
        <p class="chart-note detail-chart-note" id="actor-detail-note" hidden>Cada ponto representa um ano com lançamentos.</p>
        <section class="focus-metrics" id="focus-metrics" aria-label="Resumo da seleção"></section>
        <div class="origin-list" id="actor-origins"></div>
      </article>
      <article class="card card-outcomes">
        <p class="eyebrow">Resultados por ano</p>
        <h2>Como os resultados dos lançamentos mudaram?</h2>
        <p class="card-description">Os lançamentos são agrupados em blocos de três anos. O painel superior compara sucessos e não sucessos; o inferior mostra a distribuição relativa das categorias de não sucesso.</p>
        <div class="chart" id="outcomes-chart"><div class="loading-state">Consultando os resultados por ano…</div></div>
        <p class="chart-note">No painel inferior, cada barra soma 100% dos não sucessos do bloco. O tooltip também informa a proporção de cada categoria sobre todos os lançamentos.</p>
      </article>
      <article class="card card-ranking">
        <div class="ranking-heading">
          <div>
            <p class="eyebrow">Comparação</p>
            <h2>Filtros</h2>
          </div>
          <button class="button ranking-clear-button" id="clear-filters" type="button">Limpar filtros</button>
          <p class="ranking-hint">Clique em um ator do ranking para filtrar; use “Filtrar setor” para restringir por setor.</p>
        </div>
        <div class="ranking-tools">
          <label class="sector-control">
            <span class="eyebrow">Filtrar setor</span>
            <select id="sector-filter">
              <option value="">Todos</option>
              <option value="Comercial">Comercial</option>
              <option value="Civil">Civil</option>
              <option value="Militar">Militar</option>
              <option value="Indefinido">Indefinido</option>
            </select>
          </label>
          <label class="sort-control">
            <span class="eyebrow">Ordenar por</span>
            <select id="ranking-sort">
              <option value="launches">Lançamentos</option>
              <option value="success">Taxa de sucesso</option>
            </select>
          </label>
        </div>
        <div class="ranking-list" id="ranking-list"><div class="loading-state">Calculando o ranking…</div></div>
      </article>
      <article class="card card-map">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Geografia</p>
            <h2>De onde partem os lançamentos?</h2>
            <p class="card-description map-context">O tamanho dos círculos representa o volume de lançamentos por base.</p>
          </div>
          <div class="map-legend"><span style="width:7px;height:7px"></span>menos <span style="width:15px;height:15px"></span>mais</div>
        </div>
        <div class="chart map-wrap" id="map-chart"><div class="loading-state">Localizando bases…</div></div>
      </article>
    </section>
  </main>
  <dialog id="about-dialog" aria-labelledby="about-title">
    <div class="dialog-head">
      <div>
        <p class="eyebrow">Contexto e método</p>
        <h2 id="about-title">Sobre os dados</h2>
      </div>
      <button class="button" id="about-close" type="button" aria-label="Fechar">Fechar</button>
    </div>
    <p>Este painel investiga como a exploração espacial passou da disputa entre EUA e URSS para um cenário com novos países e operadores comerciais. Use o brush da linha do tempo para selecionar anos, o ranking para selecionar atores, o filtro de setor para restringir a exploração e os botões de cor para alternar entre quem lança e que setor lança.</p>
    <h3>Fontes</h3>
    <ul>
      <li><a href="https://planet4589.org/space/gcat/" target="_blank" rel="noreferrer">GCAT — Jonathan McDowell</a>: lançamentos, operadores e bases. Snapshot de 17/10/2026.</li>
      <li><a href="https://ourworldindata.org/grapher/yearly-number-of-objects-launched-into-outer-space" target="_blank" rel="noreferrer">Our World in Data</a>: objetos lançados por país e ano.</li>
      <li><a href="https://github.com/topojson/world-atlas" target="_blank" rel="noreferrer">world-atlas</a>: geometria geográfica.</li>
    </ul>
    <h3>Como interpretar</h3>
    <p>Atores são agrupados pelo país do operador; URSS e Rússia formam uma linhagem, e países europeus são agregados em “Europa”. O gráfico de resultados apresenta a composição percentual das categorias registradas pelo GCAT em cada ano e segue os filtros de período, ator e setor. No GCAT, sucesso é propulsivo: indica que o foguete chegou à órbita, não necessariamente que a carga cumpriu sua missão.</p>
    <h3>Limitações</h3>
    <p>O GCAT é mantido por uma pessoa e suas classificações podem mudar. “País” pode significar operador, base ou cliente; aqui usamos o operador nos gráficos e mostramos a localização física no mapa. A categoria comercial segue a classificação do GCAT e pode incluir empresas estatais. O OWID conta objetos, não lançamentos — uma missão pode colocar muitos satélites em órbita.</p>
  </dialog>
`;

const elements = {
  timeline: document.querySelector("#timeline-chart"),
  outcomes: document.querySelector("#outcomes-chart"),
  ranking: document.querySelector("#ranking-list"),
  map: document.querySelector("#map-chart"),
  actorFocus: document.querySelector("#actor-focus"),
  sectorFocus: document.querySelector("#sector-focus"),
  detailPeriod: document.querySelector("#detail-period"),
  focusMetrics: document.querySelector("#focus-metrics"),
  detailChart: document.querySelector("#actor-detail-chart"),
  detailNote: document.querySelector("#actor-detail-note"),
  origins: document.querySelector("#actor-origins"),
  status: document.querySelector("#filter-summary"),
  clear: document.querySelector("#clear-filters"),
  dialog: document.querySelector("#about-dialog"),
};
let world;
let currentData;
let refreshId = 0;

function updateFilterStatus(state) {
  const parts = [`${state.years[0]}–${state.years[1]}`];
  if (state.sector) parts.push(`setor ${state.sector}`);
  if (state.actor) parts.push(`${state.actor} selecionado`);
  elements.status.innerHTML = "";
  const strong = document.createElement("strong");
  strong.textContent = parts.join(" · ");
  elements.status.append(strong);
  document.querySelector("#sector-filter").value = state.sector || "";
  for (const button of document.querySelectorAll("[data-color-by]")) {
    button.setAttribute("aria-pressed", String(button.dataset.colorBy === state.colorBy));
  }
}

function redraw(state) {
  if (!currentData || !world) return;
  drawTimeline(
    elements.timeline,
    currentData.timeline,
    state,
    (years) => setState({ years }),
    selectActor,
    selectSector,
  );
  drawOutcomeComposition(elements.outcomes, currentData.outcomes, state);
  drawRanking(elements.ranking, currentData.ranking, state, selectActor);
  drawMap(elements.map, currentData.sites, world, state);
  drawFocusSummary(elements.actorFocus, "Ator em foco", state.actor, "Nenhum ator em foco.");
  drawFocusSummary(elements.sectorFocus, "Setor em foco", state.sector, "Nenhum setor selecionado.");
  elements.detailPeriod.textContent = `Intervalo selecionado: ${state.years[0]}–${state.years[1]}`;
  drawFocusMetrics(
    elements.focusMetrics,
    currentData.focusSummary,
    state.actor,
    currentData.ranking.length ? currentData.ranking[0].actor : null,
    currentData.detail,
  );
  drawDetailChart(
    elements.detailChart,
    elements.detailNote,
    elements.origins,
    currentData.detail,
    state.actor,
    currentData.origins,
    state.years,
  );
  updateFilterStatus(state);
}

function selectActor(actor) {
  setState({ actor: getState().actor === actor ? null : actor, colorBy: "actor" });
}

function selectSector(sector) {
  const selected = getState().sector === sector ? null : sector;
  setState({ sector: selected });
}

async function refresh(state) {
  const id = ++refreshId;
  updateFilterStatus(state);
  try {
    const [timeline, ranking, focusSummary, outcomes, sites, detail, origins] = await Promise.all([
      getTimeline(state.colorBy, state.sector),
      getRanking(state.years, state.sector),
      getFocusSummary(state.years, state.actor, state.sector),
      getOutcomeComposition(state.years, state.actor, state.sector),
      getSites(state.years, state.actor, state.sector),
      getActorDetail(state.years, state.actor, state.sector),
      getActorOrigins(state.years, state.actor, state.sector),
    ]);
    if (id !== refreshId) return;
    currentData = { timeline, ranking, focusSummary, outcomes, sites, detail, origins };
    redraw(state);
  } catch (error) {
    if (id !== refreshId) return;
    console.error(error);
    for (const element of [
      elements.timeline,
      elements.outcomes,
      elements.ranking,
      elements.map,
      elements.actorFocus,
      elements.sectorFocus,
      elements.detailPeriod,
      elements.focusMetrics,
      elements.detailChart,
      elements.origins,
    ]) {
      const message = document.createElement("div");
      message.className = "error-state";
      message.textContent = `Não foi possível carregar esta visualização: ${error.message}`;
      element.replaceChildren(message);
    }
    elements.status.textContent = `Erro ao carregar os dados: ${error.message}`;
  }
}

document.querySelectorAll("[data-color-by]").forEach((button) => {
  button.addEventListener("click", () => setState({ colorBy: button.dataset.colorBy }));
});
elements.clear.addEventListener("click", () =>
  setState({ years: [1957, 2026], actor: null, sector: null }),
);
document.querySelector("#sector-filter").addEventListener("change", (event) => {
  setState({ sector: event.target.value || null });
});
document.querySelector("#about-open").addEventListener("click", () => elements.dialog.showModal());
document.querySelector("#about-close").addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});
document.querySelector("#ranking-sort").addEventListener("change", (event) => {
  if (currentData) drawRanking(elements.ranking, currentData.ranking, getState(), selectActor);
});

subscribe((state) => {
  updateFilterStatus(state);
  refresh(state);
});

window.addEventListener("resize", () => redraw(getState()));

async function start() {
  try {
    const [summary, mapResponse] = await Promise.all([
      getSummary(),
      fetch(`${import.meta.env.BASE_URL}data/world-atlas-50m.json`),
    ]);
    if (!mapResponse.ok) throw new Error(`Falha ao carregar o mapa: HTTP ${mapResponse.status}`);
    world = await mapResponse.json();
    const lastYear = Number(summary.last_year);
    setState({ years: [Number(summary.first_year), lastYear] });
    const stat = document.createElement("p");
    stat.className = "brand-stat";
    const total = document.createElement("strong");
    total.textContent = new Intl.NumberFormat("pt-BR").format(summary.total);
    stat.append(total, ` lançamentos orbitais analisados · ${summary.first_year}–${lastYear}`);
    document.querySelector(".brand").append(stat);
  } catch (error) {
    console.error(error);
    elements.status.textContent = `Erro ao preparar o dashboard: ${error.message}`;
    document.querySelectorAll(".loading-state").forEach((node) => {
      node.className = "error-state";
      node.textContent = `Não foi possível carregar os dados: ${error.message}`;
    });
  }
}

start();
