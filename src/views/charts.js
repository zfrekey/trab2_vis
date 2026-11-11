import * as d3 from "d3";
import { feature } from "topojson-client";
import { MILESTONES } from "../data/milestones.js";
import {
  ACTOR_COLORS,
  ACTOR_ORDER,
  COLORS,
  FADED_OPACITY,
  SECTOR_COLORS,
  SECTOR_ORDER,
} from "../shared/styles/palette.js";

const fmtInt = new Intl.NumberFormat("pt-BR");
const fmtPct = (value) =>
  value == null ? "—" : `${(Number(value) * 100).toFixed(1).replace(".", ",")}%`;

function chartSize(element, height) {
  return { width: Math.max(300, element.clientWidth), height };
}

function svgRoot(element, width, height, label) {
  return d3.select(element).html("")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", label);
}

function tooltip(element, event, content) {
  const tip = d3.select(document.body)
    .selectAll(".tooltip").data([null]).join("div")
    .attr("class", "tooltip").style("display", "block")
    .text(content);
  const rect = tip.node().getBoundingClientRect();
  tip.style("left", `${Math.min(event.clientX + 14, innerWidth - rect.width - 8)}px`)
    .style("top", `${Math.min(event.clientY + 14, innerHeight - rect.height - 8)}px`);
}

function hideTooltip(element) {
  d3.select(document.body).selectAll(".tooltip").remove();
}

export function drawTimeline(element, rows, state, onBrush, onActor, onSector) {
  const { width, height } = chartSize(element, 270);
  const margin = { top: 34, right: 16, bottom: 38, left: 66 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const categories = state.colorBy === "sector"
    ? SECTOR_ORDER
    : state.sector
      ? ACTOR_ORDER.filter((actor) => rows.some((row) => row.category === actor))
      : ACTOR_ORDER;
  const colors = state.colorBy === "sector" ? SECTOR_COLORS : ACTOR_COLORS;
  const years = d3.range(1957, 2027).map((year) => {
    const row = { year };
    for (const category of categories) row[category] = 0;
    return row;
  });
  for (const row of rows) {
    if (years[row.year - 1957]) years[row.year - 1957][row.category] = Number(row.launches);
  }

  const x = d3.scaleLinear().domain([1957, 2026]).range([0, innerWidth]);
  const stack = d3.stack().keys(categories)(years);
  const maxTotal = d3.max(years, (row) => d3.sum(categories, (category) => row[category])) || 1;
  const y = d3.scaleLinear().domain([0, maxTotal]).nice().range([innerHeight, 0]);
  const svg = svgRoot(
    element,
    width,
    height,
    "Lançamentos orbitais por ano, empilhados por ator ou setor. Selecione um intervalo com o brush.",
  );
  const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const yTicks = y.ticks(5);
  const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  plot.append("g").attr("class", "grid-axis")
    .call(d3.axisLeft(y).tickValues(yTicks).tickSize(-innerWidth).tickFormat(() => ""));
  plot.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(Math.min(8, Math.floor(innerWidth / 75))).tickFormat(d3.format("d")));
  plot.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).tickValues(yTicks).tickFormat(numberFormat.format));
  plot.append("text")
    .attr("class", "axis-title")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -48)
    .attr("text-anchor", "middle")
    .text("Número de lançamentos");

  const area = d3.area()
    .x((point) => x(point.data.year))
    .y0((point) => y(point[0]))
    .y1((point) => y(point[1]));
  plot.append("g").selectAll("path")
    .data(stack, (series) => series.key)
    .join("path")
    .attr("d", area)
    .attr("fill", (series) => colors[series.key])
    .attr("fill-opacity", (series) => {
      if (state.colorBy === "sector" && state.sector && state.sector !== series.key) {
        return FADED_OPACITY;
      }
      if (state.colorBy === "actor" && state.actor && state.actor !== series.key) {
        return FADED_OPACITY;
      }
      return 0.82;
    })
    .attr("stroke", (series) =>
      (state.colorBy === "actor" && state.actor === series.key)
        || (state.colorBy === "sector" && state.sector === series.key)
        ? COLORS.highlight
        : "white",
    )
    .attr("stroke-width", (series) =>
      (state.colorBy === "actor" && state.actor === series.key)
        || (state.colorBy === "sector" && state.sector === series.key)
        ? 1.5
        : 0.55,
    )
    .style("cursor", "pointer")
    .on("click", (_event, series) => {
      if (state.colorBy === "actor") onActor(series.key);
      else onSector(series.key);
    });

  const annotationRows = [-Infinity, -Infinity];
  const annotations = MILESTONES.map((event) => {
    const xpos = x(event.year);
    plot.append("line")
      .attr("x1", xpos).attr("x2", xpos).attr("y1", 0).attr("y2", innerHeight)
      .attr("stroke", COLORS.muted).attr("stroke-width", 0.7)
      .attr("stroke-dasharray", "2 4").attr("opacity", 0.42);
    const text = `${event.year} · ${event.label}`;
    return { xpos, text, labelWidth: text.length * 4.7 };
  }).sort((a, b) => a.xpos - b.xpos);

  // Distribuímos as notas em duas faixas quando necessário e mantemos cada
  // rótulo dentro do cartão, evitando colisões nos marcos dos anos recentes.
  for (const annotation of annotations) {
    const textX = Math.max(0, Math.min(
      innerWidth - annotation.labelWidth,
      annotation.xpos + 3,
    ));
    const rowIndex = annotationRows.findIndex((end) => textX > end + 5);
    const row = rowIndex === -1 ? 1 : rowIndex;
    annotationRows[row] = textX + annotation.labelWidth;
    plot.append("text").attr("x", textX).attr("y", row === 0 ? -8 : -19)
      .attr("fill", COLORS.muted).attr("font-family", "Georgia, serif")
      .attr("font-size", 9).attr("font-style", "italic")
      .text(annotation.text);
  }

  const brush = d3.brushX()
    .extent([[0, 0], [innerWidth, innerHeight]])
    .on("end", (event) => {
      if (!event.sourceEvent) return;
      if (!event.selection) return onBrush([1957, 2026]);
      const selectedYears = event.selection.map((pixel) => Math.round(x.invert(pixel)));
      onBrush([Math.max(1957, selectedYears[0]), Math.min(2026, selectedYears[1])]);
    });
  const brushLayer = plot.append("g").attr("class", "brush").call(brush);
  const selection = state.years.map((year) => x(year));
  brushLayer.call(brush.move, selection);
  brushLayer.selectAll(".selection")
    .attr("fill", COLORS.highlight).attr("fill-opacity", 0.13)
    .attr("stroke", COLORS.highlight).attr("stroke-width", 1);
  brushLayer.selectAll(".handle").attr("fill", COLORS.highlight);

  const legend = d3.select(element.parentElement).select(".timeline-legend");
  legend.html("");
  legend.selectAll("li").data(categories).join("li").append("button")
    .attr("type", "button")
    .classed("is-selected", (category) =>
      state.colorBy === "actor" ? category === state.actor : category === state.sector,
    )
    .attr("aria-pressed", (category) =>
      state.colorBy === "actor" ? category === state.actor : category === state.sector,
    )
    .on("click", (_event, category) => {
      if (state.colorBy === "actor") onActor(category);
      else onSector(category);
    })
    .each(function (category) {
      d3.select(this).append("span").attr("class", "legend-swatch")
        .style("background", colors[category]);
      d3.select(this).append("span").text(category);
    });
}

export function drawRanking(element, rows, state, onActor) {
  const search = element.closest(".card").querySelector("#actor-search").value
    .trim().toLocaleLowerCase("pt-BR");
  const sortBy = element.closest(".card").querySelector("#ranking-sort").value;
  const filtered = rows
    .filter((row) => row.actor.toLocaleLowerCase("pt-BR").includes(search))
    .sort((a, b) => sortBy === "success"
      ? Number(b.success_rate ?? -1) - Number(a.success_rate ?? -1)
      : Number(b.launches) - Number(a.launches));
  const max = d3.max(filtered, (row) => Number(row.launches)) || 1;
  const list = d3.select(element).html("");

  if (!filtered.length) {
    list.append("p").attr("class", "empty-state").text("Nenhum ator encontrado.");
    return;
  }
  list.selectAll("button").data(filtered, (row) => row.actor).join("button")
    .attr("type", "button")
    .attr("class", (row) => `ranking-row${row.actor === state.actor ? " is-selected" : ""}`)
    .attr("aria-pressed", (row) => row.actor === state.actor)
    .on("click", (_event, row) => onActor(row.actor))
    .each(function (row, index) {
      const button = d3.select(this);
      const color = ACTOR_COLORS[row.actor] || ACTOR_COLORS.Outros;
      button.append("span").attr("class", "rank-number").text(String(index + 1).padStart(2, "0"));
      const name = button.append("span").attr("class", "rank-name");
      name.append("span").text(row.actor);
      name.append("small").attr("class", "rank-meta")
        .text(`${fmtPct(row.success_rate)} sucesso médio`);
      name.append("span").attr("class", "rank-bar")
        .append("span").style("width", `${100 * Number(row.launches) / max}%`)
        .style("background", color);
      button.append("span").attr("class", "rank-value").text(fmtInt.format(row.launches));
    });
}

export function drawLearning(element, rows, state) {
  const { width, height } = chartSize(element, 245);
  const margin = { top: 18, right: 12, bottom: 36, left: 48 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const grouped = d3.group(rows, (row) => row.actor);
  const maxExperience = d3.max(rows, (row) => Number(row.launches_so_far)) || 10;
  const xMaximum = Math.max(10, maxExperience);
  const maxExponent = Math.floor(Math.log10(xMaximum));
  const xTicks = d3.range(0, maxExponent + 1).map((exponent) => 10 ** exponent);
  const x = d3.scaleLog().domain([1, xMaximum]).range([0, innerWidth]);
  const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);
  const svg = svgRoot(element, width, height,
    "Curva de aprendizado: quantidade acumulada de lançamentos em escala logarítmica versus taxa de sucesso acumulada.");
  const plot = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  plot.append("defs").append("clipPath").attr("id", "learning-plot-clip")
    .append("rect").attr("width", innerWidth).attr("height", innerHeight);
  plot.append("g").attr("class", "grid-axis")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerWidth).tickFormat(() => ""));
  plot.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).tickValues(xTicks).tickFormat((value) =>
      value >= 1000 ? `${value / 1000}k` : String(value),
    ));
  plot.append("g").attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));
  const line = d3.line()
    .defined((row) =>
      Number(row.launches_so_far) > 0
      && Number.isFinite(Number(row.success_rate_so_far))
      && Number(row.success_rate_so_far) >= 0
      && Number(row.success_rate_so_far) <= 1,
    )
    .x((row) => x(Number(row.launches_so_far)))
    .y((row) => y(Number(row.success_rate_so_far)));

  for (const [actor, series] of grouped) {
    const ordered = series.sort((a, b) => Number(a.launches_so_far) - Number(b.launches_so_far));
    const selected = !state.actor || state.actor === actor;
    plot.append("path").datum(ordered)
      .attr("fill", "none").attr("stroke", ACTOR_COLORS[actor] || ACTOR_COLORS.Outros)
      .attr("stroke-width", state.actor === actor ? 2.8 : 1.65)
      .attr("stroke-opacity", selected ? 0.86 : FADED_OPACITY)
      .attr("clip-path", "url(#learning-plot-clip)")
      .attr("d", line);
  }
  const legend = d3.select(element.parentElement).select(".learning-legend");
  legend.html("").selectAll("span").data(ACTOR_ORDER).join("span")
    .style("opacity", (actor) =>
      (!state.actor || state.actor === actor) ? 1 : FADED_OPACITY,
    )
    .each(function (actor) {
      d3.select(this).append("i").style("background", ACTOR_COLORS[actor]);
      d3.select(this).append("span").text(actor);
    });
}

export function drawMap(element, sites, world, state) {
  const { width, height } = chartSize(element, 310);
  const svg = svgRoot(element, width, height,
    "Mapa das bases orbitais com tamanho do círculo proporcional ao número de lançamentos no período.");
  const projection = d3.geoNaturalEarth1().fitExtent(
    [[12, 12], [width - 12, height - 12]],
    feature(world, world.objects.countries),
  );
  const path = d3.geoPath(projection);
  svg.append("g").selectAll("path")
    .data(feature(world, world.objects.countries).features)
    .join("path").attr("class", "map-country").attr("d", path);
  const radius = d3.scaleSqrt()
    .domain([1, d3.max(sites, (site) => Number(site.launches)) || 1])
    .range([2.5, 12]);
  svg.append("g").selectAll("circle").data(sites, (site) => `${site.site_name}-${site.lat}-${site.lon}`)
    .join("circle")
    .attr("class", "site-dot")
    .attr("transform", (site) => {
      const point = projection([Number(site.lon), Number(site.lat)]);
      return point ? `translate(${point})` : null;
    })
    .attr("r", (site) => radius(Number(site.launches)))
    .attr("fill", COLORS.accent)
    .attr("fill-opacity", 0.62)
    .on("pointermove", (event, site) => {
      tooltip(element, event,
        `${site.site_name || "Base não identificada"} (${site.site_state || "?"}) · ${fmtInt.format(site.launches)} lançamentos`);
    })
    .on("pointerleave", () => hideTooltip(element))
    .append("title")
    .text((site) => `${site.site_name || "Base não identificada"}: ${fmtInt.format(site.launches)} lançamentos`);

  const filters = [
    state.actor,
    state.sector && `setor ${state.sector}`,
  ].filter(Boolean);
  const focus = filters.length ? ` de ${filters.join(" · ")}` : "";
  element.closest(".card").querySelector(".map-context").textContent =
    `Bases${focus} entre ${state.years[0]} e ${state.years[1]}; o tamanho representa o volume de lançamentos.`;
}

function drawTrendChart(element, rows, label, color) {
  if (!rows.length) {
    element.textContent = "Nenhum lançamento neste intervalo.";
    element.className = "detail-empty";
    return;
  }
  const { width, height } = chartSize(element, 100);
  const margin = { top: 8, right: 6, bottom: 19, left: 6 };
  const x = d3.scaleLinear()
    .domain(d3.extent(rows, (row) => Number(row.year)))
    .range([margin.left, width - margin.right]);
  const max = d3.max(rows, (row) => Number(row.launches)) || 1;
  const y = d3.scaleLinear().domain([0, max]).nice()
    .range([height - margin.bottom, margin.top]);
  const svg = svgRoot(element, width, height, `Lançamentos anuais de ${label}.`);
  svg.append("path").datum(rows)
    .attr("fill", "none").attr("stroke", color)
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x((row) => x(Number(row.year)))
      .y((row) => y(Number(row.launches))));
  svg.append("g").selectAll("circle").data(rows).join("circle")
    .attr("cx", (row) => x(Number(row.year)))
    .attr("cy", (row) => y(Number(row.launches)))
    .attr("r", 2.5).attr("fill", color)
    .append("title").text((row) => `${row.year}: ${fmtInt.format(row.launches)} lançamentos`);
  svg.append("g").attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")));
}

export function drawSectorDetail(element, rows, sector, ranking, onActor) {
  const total = d3.sum(rows, (row) => Number(row.launches)) || 0;
  const successTotal = d3.sum(rows, (row) => Number(row.success_total) || 0);
  const successCount = d3.sum(rows, (row) => Number(row.success_count) || 0);
  const successRate = successCount ? successTotal / successCount : null;
  element.innerHTML = `
    <div class="detail-card-top">
      <p class="eyebrow">Setor em foco</p>
      <h3 class="detail-name"></h3>
      <p class="detail-subtitle">Intervalo selecionado: ${rows[0]?.year ?? "—"}–${rows.at(-1)?.year ?? "—"}</p>
    </div>
    <div class="metric-grid">
      <div><span class="metric-label">Lançamentos</span><strong class="metric-value">${fmtInt.format(total)}</strong></div>
      <div><span class="metric-label">Sucesso médio</span><strong class="metric-value">${fmtPct(successRate)}</strong></div>
    </div>
    <p class="eyebrow">Ritmo anual</p>
    <div class="detail-sparkline"></div>
    <p class="chart-note">Cada ponto representa um ano com lançamentos.</p>
    <div class="origin-list">
      <p class="eyebrow">Atores neste setor · selecione para detalhar</p>
      <ul></ul>
    </div>
  `;
  element.querySelector(".detail-name").textContent = sector;
  drawTrendChart(
    element.querySelector(".detail-sparkline"),
    rows,
    sector,
    SECTOR_COLORS[sector] || COLORS.accent,
  );
  const list = element.querySelector(".origin-list ul");
  if (!ranking.length) {
    const item = document.createElement("li");
    item.textContent = "Nenhum lançamento neste setor e intervalo.";
    list.append(item);
    return;
  }
  for (const actor of ranking.slice(0, 5)) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "detail-actor-button";
    button.textContent = actor.actor;
    button.addEventListener("click", () => onActor(actor.actor));
    const count = document.createElement("strong");
    count.textContent = fmtInt.format(actor.launches);
    item.append(button, count);
    list.append(item);
  }
}

export function drawDetail(element, rows, actor, ranking, origins) {
  if (!actor) {
    element.innerHTML = '<div class="detail-empty">Selecione um ator no ranking ou na legenda para ver sua trajetória.</div>';
    return;
  }
  const total = d3.sum(rows, (row) => Number(row.launches)) || 0;
  const actorRow = ranking.find((row) => row.actor === actor);
  element.innerHTML = `
    <div class="detail-card-top">
      <p class="eyebrow">Ator em foco</p>
      <h3 class="detail-name"></h3>
      <p class="detail-subtitle">Intervalo selecionado: ${rows[0]?.year ?? "—"}–${rows.at(-1)?.year ?? "—"}</p>
    </div>
    <div class="metric-grid">
      <div><span class="metric-label">Lançamentos</span><strong class="metric-value">${fmtInt.format(total)}</strong></div>
      <div><span class="metric-label">Sucesso médio</span><strong class="metric-value">${fmtPct(actorRow?.success_rate)}</strong></div>
    </div>
    <p class="eyebrow">Ritmo anual</p>
    <div class="detail-sparkline"></div>
    <p class="chart-note">Cada ponto representa um ano com lançamentos.</p>
    <div class="origin-list">
      <p class="eyebrow">Operadores e países no grupo</p>
      <ul></ul>
    </div>
  `;
  element.querySelector(".detail-name").textContent = actor;
  const chart = element.querySelector(".detail-sparkline");
  drawTrendChart(chart, rows, actor, ACTOR_COLORS[actor] || ACTOR_COLORS.Outros);

  const originList = element.querySelector(".origin-list ul");
  if (origins.length) {
    for (const origin of origins) {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = `${origin.org_name || "Operador não identificado"} · ${origin.org_state}`;
      const count = document.createElement("strong");
      count.textContent = fmtInt.format(origin.launches);
      item.append(name, count);
      originList.append(item);
    }
  } else {
    const item = document.createElement("li");
    item.textContent = "País de origem não informado pelo GCAT.";
    originList.append(item);
  }
}
