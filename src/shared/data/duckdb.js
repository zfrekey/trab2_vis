// Mantemos uma instância e conexão únicas para todas as consultas do dashboard.
import * as duckdb from "@duckdb/duckdb-wasm";
import duckdbWasmMvp from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbWorkerMvp from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdbWasmEh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdbWorkerEh from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

const bundles = {
  mvp: { mainModule: duckdbWasmMvp, mainWorker: duckdbWorkerMvp },
  eh: { mainModule: duckdbWasmEh, mainWorker: duckdbWorkerEh },
};

let dbPromise;
let connectionPromise;
const registeredFiles = new Set();

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const bundle = await duckdb.selectBundle(bundles);
      const worker = new Worker(bundle.mainWorker);
      const db = new duckdb.AsyncDuckDB(
        new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING),
        worker,
      );
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      return db;
    })();
  }
  return dbPromise;
}

function getConnection() {
  if (!connectionPromise) connectionPromise = getDb().then((db) => db.connect());
  return connectionPromise;
}

// Arrow é convertido em objetos simples; BigInt vira Number para facilitar
// formatação e uso nas escalas do D3.
export async function query(sql, params = []) {
  const connection = await getConnection();
  const result = params.length
    ? await (await connection.prepare(sql)).query(...params)
    : await connection.query(sql);

  return result.toArray().map((row) => {
    const value = row.toJSON();
    for (const key in value) {
      if (typeof value[key] === "bigint") value[key] = Number(value[key]);
    }
    return value;
  });
}

export async function registerLocalFile(name, url) {
  if (registeredFiles.has(name)) return;
  const db = await getDb();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao carregar ${url}: HTTP ${response.status}`);
  await db.registerFileBuffer(name, new Uint8Array(await response.arrayBuffer()));
  registeredFiles.add(name);
}
