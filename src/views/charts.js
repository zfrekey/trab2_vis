import * as d3 from "d3";
import { feature } from "topojson-client";
import { MILESTONES } from "../data/milestones.js";
import {
  ACTOR_COLORS,
  ACTOR_ORDER,
  COLORS,
  FADED_OPACITY,
  OUTCOME_COLORS,
  OUTCOME_LABELS,
  OUTCOME_ORDER,
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
  const sortBy = element.closest(".card").querySelector("#ranking-sort").value;
  const filtered = [...rows].sort((a, b) => sortBy === "success"
      ? Number(b.success_rate ?? -1) - Number(a.success_rate ?? -1)
      : Number(b.launches) - Number(a.launches));
  const max = d3.max(filtered, (row) => Number(row.launches)) || 1;
  const list = d3.select(element).html("");

  if (!filtered.length) {
    list.append("p").attr("class", "empty-state").text("Nenhum ator para os filtros selecionados.");
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

export function drawOutcomeComposition(element, rows, state) {
  const { width, height } = chartSize(element, 400);
  const margin = { top: 22, right: 12, bottom: 38, left: 54 };
  const innerWidth = width - margin.left - margin.right;
  const [startYear, endYear] = state.years;
  const otherOutcomes = OUTCOME_ORDER.filter((outcome) => outcome !== "sucesso");
  const binCount = Math.ceil((endYear - startYear + 1) / 3);
  const bins = Array.from({ length: binCount }, (_, index) => {
    const firstYear = startYear + index * 3;
    const lastYear = Math.min(firstYear + 2, endYear);
    return {
      firstYear,
      lastYear,
      label: firstYear === lastYear ? String(firstYear) : `${firstYear}–${lastYear}`,
      counts: Object.fromEntries(OUTCOME_ORDER.map((outcome) => [outcome, 0])),
    };
  });
  for (const row of rows) {
    const bin = bins[Math.floor((Number(row.year) - startYear) / 3)];
    if (bin && Object.hasOwn(bin.counts, row.outcome)) {
      bin.counts[row.outcome] += Number(row.launches);
    }
  }
  for (const bin of bins) {
    bin.total = d3.sum(OUTCOME_ORDER, (outcome) => bin.counts[outcome]);
    bin.otherTotal = d3.sum(otherOutcomes, (outcome) => bin.counts[outcome]);
    bin.successShare = bin.total ? bin.counts.sucesso / bin.total : 0;
    for (const outcome of otherOutcomes) {
      bin[outcome] = bin.otherTotal ? bin.counts[outcome] / bin.otherTotal : 0;
    }
  }

  const binLabels = bins.map((bin) => bin.label);
  const x = d3.scaleBand().domain(binLabels).range([0, innerWidth]).padding(0.18);
  const tickStep = Math.max(1, Math.ceil(bins.length / Math.max(2, Math.floor(innerWidth / 62))));
  const xTickValues = bins
    .filter((_bin, index) => index % tickStep === 0 || index === bins.length - 1)
    .map((bin) => bin.label);
  const panelGap = 30;
  const panelHeight = (height - margin.top - margin.bottom - panelGap) / 2;
  const successY = d3.scaleLinear().domain([0, 1]).range([panelHeight, 0]);
  const otherY = d3.scaleLinear().domain([0, 1]).range([panelHeight, 0]);
  const filters = [
    state.actor && `ator ${state.actor}`,
    state.sector && `setor ${state.sector}`,
  ].filter(Boolean);
  const filterDescription = filters.length ? ` para ${filters.join(" e ")}` : "";
  const svg = svgRoot(
    element,
    width,
    height,
    `Resultados dos lançamentos em blocos de três anos${filterDescription}, de ${startYear} a ${endYear}. O painel superior mostra a proporção de sucessos e o inferior a composição dos demais resultados.`,
  );
  const successPanel = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const otherPanel = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top + panelHeight + panelGap})`);
  const percentTicks = [0, 0.5, 1];
  const addPercentAxes = (panel, scale) => {
    panel.append("g").attr("class", "grid-axis")
      .call(d3.axisLeft(scale).tickValues(percentTicks).tickSize(-innerWidth).tickFormat(() => ""));
    panel.append("g").attr("class", "axis")
      .call(d3.axisLeft(scale).tickValues(percentTicks).tickFormat(d3.format(".0%")));
  };
  addPercentAxes(successPanel, successY);
  addPercentAxes(otherPanel, otherY);
  successPanel.append("text").attr("class", "chart-panel-title")
    .attr("x", 0).attr("y", -8)
    .text("Sucesso (% de todos os lançamentos)");
  otherPanel.append("text").attr("class", "chart-panel-title")
    .attr("x", 0).attr("y", -8)
    .text("Outros resultados (composição entre não sucessos)");

  const successMarks = successPanel.selectAll(".success-bin")
    .data(bins.filter((bin) => bin.total > 0))
    .join("g")
    .attr("class", "success-bin")
    .attr("transform", (bin) => `translate(${x(bin.label)},0)`)
    .on("pointermove", (event, bin) => {
      const count = bin.counts.sucesso;
      tooltip(element, event,
        `${bin.label} · Sucesso: ${fmtInt.format(count)} de ${fmtInt.format(bin.total)} lançamentos (${fmtPct(bin.successShare)})`);
    })
    .on("pointerleave", () => hideTooltip(element));
  successMarks.append("rect")
    .attr("width", x.bandwidth())
    .attr("height", panelHeight)
    .attr("fill", "#f1efe8");
  successMarks.append("rect")
    .attr("y", (bin) => successY(bin.successShare))
    .attr("width", x.bandwidth())
    .attr("height", (bin) => panelHeight - successY(bin.successShare))
    .attr("fill", OUTCOME_COLORS.sucesso);
  successMarks.append("title")
    .text((bin) =>
      `${bin.label} · Sucesso: ${fmtInt.format(bin.counts.sucesso)} de ${fmtInt.format(bin.total)} (${fmtPct(bin.successShare)})`,
    );

  const stackedOthers = d3.stack().keys(otherOutcomes)(bins);
  otherPanel.append("g").selectAll("g")
    .data(stackedOthers, (series) => series.key)
    .join("g")
    .attr("fill", (series) => OUTCOME_COLORS[series.key])
    .selectAll("rect")
    .data((series) => series.map((segment) => ({ segment, outcome: series.key })))
    .join("rect")
    .attr("x", ({ segment }) => x(segment.data.label))
    .attr("y", ({ segment }) => otherY(segment[1]))
    .attr("width", x.bandwidth())
    .attr("height", ({ segment }) => Math.max(0, otherY(segment[0]) - otherY(segment[1])))
    .on("pointermove", (event, { segment, outcome }) => {
      const count = segment.data.counts[outcome];
      tooltip(element, event,
        `${segment.data.label} · ${OUTCOME_LABELS[outcome]}: ${fmtInt.format(count)} (${fmtPct(count / segment.data.total)} de todos; ${fmtPct(segment[1] - segment[0])} entre os outros resultados, n=${fmtInt.format(segment.data.otherTotal)})`);
    })
    .on("pointerleave", () => hideTooltip(element))
    .append("title")
    .text(({ segment, outcome }) => {
      const count = segment.data.counts[outcome];
      return `${segment.data.label} · ${OUTCOME_LABELS[outcome]}: ${fmtInt.format(count)} (${fmtPct(count / segment.data.total)} de todos; ${fmtPct(segment[1] - segment[0])} entre os outros resultados)`;
    });

  svg.append("g").attr("class", "axis")
    .attr("transform", `translate(${margin.left},${margin.top + panelHeight * 2 + panelGap})`)
    .call(d3.axisBottom(x).tickValues(xTickValues));

  if (!rows.length) {
    svg.append("text")
      .attr("class", "empty-state")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("Sem lançamentos para os filtros atuais.");
  }

  const legend = d3.select(element.parentElement).select(".outcome-legend");
  legend.html("").selectAll("span").data(OUTCOME_ORDER).join("span")
    .each(function (outcome) {
      d3.select(this).append("i").style("background", OUTCOME_COLORS[outcome]);
      d3.select(this).append("span").text(OUTCOME_LABELS[outcome]);
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

function drawTrendChart(element, rows, label, color, selectedYears) {
  if (!rows.length) {
    element.textContent = "Nenhum lançamento neste intervalo.";
    element.classList.add("detail-empty");
    return;
  }
  element.classList.remove("detail-empty");
  const { width, height } = chartSize(element, 100);
  const margin = { top: 8, right: 22, bottom: 19, left: 22 };
  const [startYear, endYear] = selectedYears;
  const yearCount = endYear - startYear + 1;
  const tickCount = Math.min(yearCount, yearCount <= 6 ? yearCount : 4);
  const tickValues = Array.from({ length: tickCount }, (_, index) =>
    Math.round(startYear + index * (yearCount - 1) / Math.max(1, tickCount - 1)),
  );
  const x = d3.scaleLinear()
    .domain(selectedYears)
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
    .call(d3.axisBottom(x).tickValues(tickValues).tickFormat(d3.format("d")));
}

export function drawFocusSummary(element, label, value, emptyMessage) {
  element.innerHTML = `
    <p class="eyebrow"></p>
    ${value ? '<h3 class="focus-name"></h3>' : ""}
    ${value ? "" : '<p class="focus-message"></p>'}
  `;
  element.querySelector(".eyebrow").textContent = label;
  if (value) element.querySelector(".focus-name").textContent = value;
  else element.querySelector(".focus-message").textContent = emptyMessage;
}

export function drawDetailChart(element, noteElement, originsElement, rows, actor, origins, years) {
  noteElement.hidden = !actor;
  originsElement.hidden = !actor;
  originsElement.innerHTML = "";
  if (!actor) {
    element.innerHTML = '<div class="detail-empty">Selecione um ator para ver o ritmo anual.</div>';
    return;
  }
  drawTrendChart(element, rows, actor, ACTOR_COLORS[actor] || ACTOR_COLORS.Outros, years);
  originsElement.innerHTML = '<p class="eyebrow">Operadores e países no grupo</p><ul></ul>';
  const originList = originsElement.querySelector("ul");
  if (!origins.length) {
    const item = document.createElement("li");
    item.textContent = "País de origem não informado pelo GCAT.";
    originList.append(item);
    return;
  }
  for (const origin of origins) {
    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = `${origin.org_name || "Operador não identificado"} · ${origin.org_state}`;
    const count = document.createElement("strong");
    count.textContent = fmtInt.format(origin.launches);
    item.append(name, count);
    originList.append(item);
  }
}
