import "./shared/styles/style.css";
import { getSummary } from "./data/launchesRepository.js";

// esqueleto inicial: so confirma que o duckdb carrega os dados
// o dashboard de verdade segue o PLANO.md e o UI.md
const app = document.getElementById("app");

app.innerHTML = `
  <header class="app-header-container">
    <div class="app-header-inner">
      <div class="app-top-row">
        <div class="app-brand">
          <h1>Trabalho 02 · Sistema de Análise Visual de Dados</h1>
          <p>Da corrida espacial à era comercial · UFF · Filype Abreu, Felipe Gomes e Lucas Paixão</p>
        </div>
      </div>
    </div>
  </header>
  <main style="max-width:1100px;margin:0 auto;padding:var(--space-5) var(--space-3)">
    <p id="status">Carregando dados no DuckDB-Wasm…</p>
  </main>
`;

const status = document.getElementById("status");

getSummary()
  .then((s) => {
    const rate = (s.success_rate * 100).toFixed(1);
    status.textContent = `${s.total} lançamentos orbitais carregados (${s.first_year}–${s.last_year}), ${rate}% de sucesso.`;
  })
  .catch((err) => {
    console.error(err);
    status.textContent = `Erro ao carregar dados: ${err.message}`;
  });
