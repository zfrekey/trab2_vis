import * as duckdb from "@duckdb/duckdb-wasm";

import duckdbWasmMvp from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbWorkerMvp from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdbWasmEh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdbWorkerEh from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

const MANUAL_BUNDLES = {
  mvp: { mainModule: duckdbWasmMvp, mainWorker: duckdbWorkerMvp },
  eh: { mainModule: duckdbWasmEh, mainWorker: duckdbWorkerEh },
};

let dbPromise = null;
let connectionPromise = null;
const registeredFiles = new Set();

// inicializa o duckdb no navegador senao a tela fica em branco e nada funciona confia
export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      const worker = new Worker(bundle.mainWorker);
      const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      return db;
    })();
  }
  return dbPromise;
}

export function getConnection() {
  if (!connectionPromise) {
    connectionPromise = getDb().then((db) => db.connect());
  }
  return connectionPromise;
}

export async function query(sql, params = []) {
  const conn = await getConnection();
  const result =
    params.length > 0
      ? await (await conn.prepare(sql)).query(...params)
      : await conn.query(sql);
  return result.toArray().map((row) => {
    const obj = row.toJSON();
    for (const k in obj) {
      if (typeof obj[k] === "bigint") obj[k] = Number(obj[k]);
    }
    return obj;
  });
}

export async function registerLocalFile(virtualName, url) {
  if (registeredFiles.has(virtualName)) return;
  const db = await getDb();
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}: HTTP ${response.status}`);
  }
  const buffer = new Uint8Array(await response.arrayBuffer());
  await db.registerFileBuffer(virtualName, buffer);
  registeredFiles.add(virtualName);
}
