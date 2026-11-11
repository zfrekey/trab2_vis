import "./shared/styles/style.css";
import {
  getActorDetail,
  getActorOrigins,
  getLearningCurveForSector,
  getRanking,
  getSites,
  getSectorDetail,
  getSummary,
  getTimeline,
} from "./data/launchesRepository.js";
import { getState, setState, subscribe } from "./state/store.js";
import {
  drawDetail,
  drawLearning,
  drawMap,
  drawRanking,
  drawSectorDetail,
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
      <div class="status-controls">
        <div class="color-switch" role="group" aria-label="Colorir linha do tempo por">
          <button type="button" data-color-by="actor" aria-pressed="true">Quem lança</button>
          <button type="button" data-color-by="sector" aria-pressed="false">Que setor</button>
        </div>
        <button class="button" id="clear-filters" type="button" hidden>Limpar filtros</button>
      </div>
    </div>
    <section class="dashboard-grid" aria-label="Painel interativo de lançamentos orbitais">
      <article class="card card-timeline">
        <div class="card-heading">
          <div>
            <p class="eyebrow">01 · Panorama histórico</p>
            <h2>O ritmo de lançamento muda com o tempo</h2>
            <p class="card-description">Quem puxou cada era — e quando o volume de lançamentos acelerou?</p>
          </div>
        </div>
        <div class="chart" id="timeline-chart"><div class="loading-state">Preparando a linha do tempo…</div></div>
        <ul class="timeline-legend" aria-label="Legenda e seleção de atores"></ul>
        <p class="chart-note">Arraste na série para filtrar os anos. Clique na legenda para selecionar um ator ou setor e coordenar as views.</p>
      </article>
      <article class="card card-detail">
        <p class="eyebrow">Leitura em foco</p>
        <h2>Um ator, em detalhe</h2>
        <div id="detail-panel" class="chart"><div class="detail-empty">Selecione um ator para começar.</div></div>
      </article>
      <article class="card card-learning">
        <p class="eyebrow">02 · Experiência e confiabilidade</p>
        <h2>Aprender a lançar, ao longo do tempo</h2>
        <p class="card-description">A taxa acumulada muda conforme cresce a experiência de cada programa?</p>
        <div class="chart" id="learning-chart"><div class="loading-state">Consultando histórico de confiabilidade…</div></div>
        <div class="learning-legend" aria-label="Cores dos atores"></div>
        <p class="chart-note">Eixo X logarítmico: a escala preserva os atores com menos lançamentos.</p>
      </article>
      <article class="card card-ranking">
        <p class="eyebrow">03 · Comparação</p>
        <h2>Quem lançou mais?</h2>
        <p class="card-description">Compare volume e taxa média no intervalo selecionado.</p>
        <div class="ranking-tools">
          <label class="search-control">
            <span class="eyebrow">Buscar ator</span>
            <input id="actor-search" type="search" placeholder="Ex.: China" autocomplete="off" />
          </label>
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
            <p class="eyebrow">04 · Geografia</p>
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
    <p>Este painel investiga como a exploração espacial passou da disputa entre EUA e URSS para um cenário com novos países e operadores comerciais. Use o brush da linha do tempo para selecionar anos, a busca e o ranking para encontrar atores, o filtro de setor para restringir a exploração e os botões de cor para alternar entre quem lança e que setor lança.</p>
    <h3>Fontes</h3>
    <ul>
      <li><a href="https://planet4589.org/space/gcat/" target="_blank" rel="noreferrer">GCAT — Jonathan McDowell</a>: lançamentos, operadores e bases. Snapshot de 17/10/2026.</li>
      <li><a href="https://ourworldindata.org/grapher/yearly-number-of-objects-launched-into-outer-space" target="_blank" rel="noreferrer">Our World in Data</a>: objetos lançados por país e ano.</li>
      <li><a href="https://github.com/topojson/world-atlas" target="_blank" rel="noreferrer">world-atlas</a>: geometria geográfica.</li>
    </ul>
    <h3>Como interpretar</h3>
    <p>Atores são agrupados pelo país do operador; URSS e Rússia formam uma linhagem, e países europeus são agregados em “Europa”. O gráfico de aprendizado usa a taxa acumulada de sucesso parcial inclusive, em ordem cronológica, e exclui resultados sem taxa definida. No GCAT, sucesso é propulsivo: indica que o foguete chegou à órbita, não necessariamente que a carga cumpriu sua missão.</p>
    <h3>Limitações</h3>
    <p>O GCAT é mantido por uma pessoa e suas classificações podem mudar. “País” pode significar operador, base ou cliente; aqui usamos o operador nos gráficos e mostramos a localização física no mapa. A categoria comercial segue a classificação do GCAT e pode incluir empresas estatais. O OWID conta objetos, não lançamentos — uma missão pode colocar muitos satélites em órbita.</p>
  </dialog>
`;

const elements = {
  timeline: document.querySelector("#timeline-chart"),
  learning: document.querySelector("#learning-chart"),
  ranking: document.querySelector("#ranking-list"),
  map: document.querySelector("#map-chart"),
  detail: document.querySelector("#detail-panel"),
  status: document.querySelector("#filter-summary"),
  clear: document.querySelector("#clear-filters"),
  dialog: document.querySelector("#about-dialog"),
};
let world;
let currentData;
let refreshId = 0;

function updateFilterStatus(state) {
  const active = state.years[0] !== 1957
    || state.years[1] !== 2026
    || state.actor
    || state.sector;
  const parts = [`${state.years[0]}–${state.years[1]}`];
  if (state.sector) parts.push(`setor ${state.sector}`);
  if (state.actor) parts.push(`${state.actor} selecionado`);
  elements.status.innerHTML = "";
  const strong = document.createElement("strong");
  strong.textContent = parts.join(" · ");
  elements.status.append(strong);
  elements.clear.hidden = !active;
  document.querySelector("#sector-filter").value = state.sector || "";
  for (const button of document.querySelectorAll("[data-color-by]")) {
    button.setAttribute("aria-pressed", String(button.dataset.colorBy === state.colorBy));
  }
}

function redraw(state) {
  if (!currentData || !world) return;
  document.querySelector(".card-detail h2").textContent = state.sector && !state.actor
    ? "Um setor, em detalhe"
    : "Um ator, em detalhe";
  drawTimeline(
    elements.timeline,
    currentData.timeline,
    state,
    (years) => setState({ years }),
    selectActor,
    selectSector,
  );
  drawLearning(elements.learning, currentData.learning, state);
  drawRanking(elements.ranking, currentData.ranking, state, selectActor);
  drawMap(elements.map, currentData.sites, world, state);
  if (state.actor) {
    drawDetail(elements.detail, currentData.detail, state.actor, currentData.ranking, currentData.origins);
  } else if (state.sector) {
    drawSectorDetail(
      elements.detail,
      currentData.sectorDetail,
      state.sector,
      currentData.ranking,
      selectActor,
    );
  } else {
    drawDetail(elements.detail, [], null, [], []);
  }
  updateFilterStatus(state);
}

function selectActor(actor) {
  setState({ actor: getState().actor === actor ? null : actor });
}

function selectSector(sector) {
  const selected = getState().sector === sector ? null : sector;
  setState({ sector: selected, actor: null });
}

async function refresh(state) {
  const id = ++refreshId;
  updateFilterStatus(state);
  try {
    const [timeline, ranking, learning, sites, detail, origins, sectorDetail] = await Promise.all([
      getTimeline(state.colorBy, state.sector),
      getRanking(state.years, state.sector),
      getLearningCurveForSector(state.sector),
      getSites(state.years, state.actor, state.sector),
      getActorDetail(state.years, state.actor, state.sector),
      getActorOrigins(state.years, state.actor, state.sector),
      getSectorDetail(state.years, state.sector),
    ]);
    if (id !== refreshId) return;
    currentData = { timeline, ranking, learning, sites, detail, origins, sectorDetail };
    redraw(state);
  } catch (error) {
    if (id !== refreshId) return;
    console.error(error);
    for (const element of Object.values(elements).slice(0, 5)) {
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
  setState({ sector: event.target.value || null, actor: null });
});
document.querySelector("#about-open").addEventListener("click", () => elements.dialog.showModal());
document.querySelector("#about-close").addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});
document.querySelector("#actor-search").addEventListener("input", (event) => {
  if (currentData) drawRanking(elements.ranking, currentData.ranking, getState(), selectActor);
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
