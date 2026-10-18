import * as d3 from "d3";

const OFFSET_X = 16;
const OFFSET_Y = 16;

export function createTooltip(container) {
  const el = d3
    .select(container)
    .append("div")
    .attr("class", "tooltip")
    .attr("role", "tooltip")
    .style("opacity", 0);

  function show(event, html) {
    el.html(html);
    move(event);
    el.style("opacity", 1);
  }

  // Segue o ponteiro, mas sem deixar o tooltip cortar nas bordas da tela.
  function move(event) {
    const { clientX, clientY } = event;
    const rect = el.node().getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - OFFSET_X;
    const maxY = window.innerHeight - rect.height - OFFSET_Y;

    const left = Math.min(clientX + OFFSET_X, Math.max(OFFSET_X, maxX));
    const top = Math.min(clientY + OFFSET_Y, Math.max(OFFSET_Y, maxY));

    el.style("left", `${left}px`).style("top", `${top}px`);
  }

  function hide() {
    el.style("opacity", 0);
  }

  return { show, move, hide };
}
