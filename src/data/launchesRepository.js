import { query, registerLocalFile } from "../shared/data/duckdb.js";

// As tabelas são carregadas uma vez; toda agregação usada pelas views fica no
// DuckDB para deixar explícita a transformação dos dados que sustenta cada marca.
const FILES = ["launch.tsv", "sites.tsv", "orgs.tsv", "owid-space-objects.csv"];
const LAUNCH_COLS = [
  "Launch_Tag", "Launch_JD", "Launch_Date", "LV_Type", "Variant", "Fairing",
  "Flight_ID", "Flight", "Mission", "FlightCode", "Platform", "Launch_Site",
  "Launch_Pad", "Ascent_Site", "Ascent_Pad", "Perigee", "Apogee", "Apoflag",
  "Inc", "Azimuth", "Range", "RangeFlag", "Dest", "OrbMass", "OrbPay", "Agency",
  "LaunchCode", "FailCode", "Group", "Category", "LTCite", "Cite", "Notes",
];
const SITE_COLS = [
  "Site", "Code", "UCode", "Type", "StateCode", "TStart", "TStop", "ShortName",
  "Name", "Location", "Longitude", "Latitude", "Error", "Parent", "ShortEName",
  "EName", "Group", "UName",
];
const ORG_COLS = [
  "Code", "UCode", "StateCode", "Type", "Class", "TStart", "TStop", "ShortName",
  "Name", "Location", "Longitude", "Latitude", "Error", "Parent", "ShortEName",
  "EName", "UName",
];
const readGcat = (file, columns) =>
  `read_csv('${file}', delim='\\t', header=false, skip=2, all_varchar=true,
    quote='', null_padding=true, names=[${columns.map((column) => `'${column}'`).join(", ")}])`;

let initPromise;

export function initLaunchData() {
  if (!initPromise) {
    initPromise = (async () => {
      const base = `${import.meta.env.BASE_URL}data/`;
      await Promise.all(FILES.map((file) => registerLocalFile(file, base + file)));

      await query(`
        CREATE TABLE IF NOT EXISTS sites AS
        SELECT trim(Site) AS site, trim(ShortName) AS site_name,
               trim(StateCode) AS site_state,
               TRY_CAST(trim(Latitude) AS DOUBLE) AS lat,
               TRY_CAST(trim(Longitude) AS DOUBLE) AS lon
        FROM ${readGcat("sites.tsv", SITE_COLS)};
      `);
      await query(`
        CREATE TABLE IF NOT EXISTS orgs AS
        SELECT trim(Code) AS org, trim(ShortName) AS org_name,
               trim(StateCode) AS org_state, trim(Class) AS org_class
        FROM ${readGcat("orgs.tsv", ORG_COLS)};
      `);

      // O país representa quem opera o lançamento; base e operador respondem
      // perguntas diferentes e permanecem disponíveis em views separadas.
      // URSS e Rússia são agrupadas como uma linhagem para evitar uma quebra
      // artificial em 1991; sucesso parcial entra como fração e não como 0/1.
      await query(`
        CREATE TABLE IF NOT EXISTS launches AS
        WITH raw AS (
          SELECT trim(Launch_Tag) AS tag,
                 CAST(substr(trim(Launch_Date), 1, 4) AS INTEGER) AS year,
                 TRY_CAST(trim(Launch_JD) AS DOUBLE) AS jd,
                 trim(LV_Type) AS vehicle,
                 trim(Launch_Site) AS site,
                 split_part(trim(Agency), '/', 1) AS org,
                 trim(LaunchCode) AS launch_code,
                 substr(trim(LaunchCode), 2, 1) AS result_letter,
                 TRY_CAST(substr(trim(LaunchCode), 3) AS INTEGER) AS result_pct
          FROM ${readGcat("launch.tsv", LAUNCH_COLS)}
          WHERE trim(LaunchCode) LIKE 'O%'
        )
        SELECT r.tag, r.year, r.jd, r.vehicle, r.launch_code,
               r.org, o.org_name, o.org_state,
               CASE
                 WHEN o.org_state = 'US' THEN 'EUA'
                 WHEN o.org_state IN ('SU', 'RU') THEN 'URSS/Rússia'
                 WHEN o.org_state = 'CN' THEN 'China'
                 WHEN o.org_state IN ('F', 'D', 'I', 'UK', 'I-ESA', 'I-ELDO') THEN 'Europa'
                 WHEN o.org_state = 'J' THEN 'Japão'
                 WHEN o.org_state = 'IN' THEN 'Índia'
                 ELSE 'Outros'
               END AS actor,
               CASE o.org_class
                 WHEN 'B' THEN 'Comercial'
                 WHEN 'C' THEN 'Civil'
                 WHEN 'D' THEN 'Militar'
                 ELSE 'Indefinido'
               END AS sector,
               r.site, s.site_name, s.site_state, s.lat, s.lon,
               CASE
                 WHEN r.result_letter = 'E' THEN 'explosao_solo'
                 WHEN r.result_letter = 'A' THEN 'aborto'
                 WHEN r.result_letter = 'U' THEN 'incerto'
                 WHEN r.result_pct IS NOT NULL THEN 'parcial'
                 WHEN r.result_letter = 'S' THEN 'sucesso'
                 ELSE 'falha'
               END AS outcome,
               CASE
                 WHEN r.result_letter NOT IN ('S', 'F') THEN NULL
                 WHEN r.result_pct IS NOT NULL THEN r.result_pct / 100.0
                 WHEN r.result_letter = 'S' THEN 1.0
                 ELSE 0.0
               END AS success_fraction
        FROM raw r
        LEFT JOIN orgs o ON o.org = r.org
        LEFT JOIN sites s ON s.site = r.site;
      `);
      await query(`
        CREATE TABLE IF NOT EXISTS owid_objects AS
        SELECT Entity AS entity, Code AS iso3, Year AS year,
               "Annual number of objects launched into outer space" AS objects
        FROM read_csv_auto('owid-space-objects.csv');
      `);
    })();
  }
  return initPromise;
}
export async function getSummary() {
  await initLaunchData();
  const [summary] = await query(`
    SELECT count(*) AS total, min(year) AS first_year, max(year) AS last_year,
           avg(success_fraction) AS success_rate
    FROM launches;
  `);
  return summary;
}

export async function getTimeline(colorBy, sector) {
  await initLaunchData();
  const dimension = colorBy === "sector" ? "sector" : "actor";
  return query(`
    SELECT year, ${dimension} AS category, count(*) AS launches
    FROM launches
    WHERE (? IS NULL OR ? = 'sector' OR sector = ?)
    GROUP BY year, ${dimension}
    ORDER BY year, ${dimension};
  `, [sector, dimension, sector]);
}

export async function getRanking([start, end], sector) {
  await initLaunchData();
  return query(`
    SELECT actor, count(*) AS launches,
           avg(success_fraction) AS success_rate
    FROM launches
    WHERE year BETWEEN ? AND ? AND (? IS NULL OR sector = ?)
    GROUP BY actor
    ORDER BY launches DESC;
  `, [start, end, sector, sector]);
}

export async function getFocusSummary([start, end], actor, sector) {
  await initLaunchData();
  const [summary] = await query(`
    SELECT count(*) AS launches, avg(success_fraction) AS success_rate
    FROM launches
    WHERE year BETWEEN ? AND ?
      AND (? IS NULL OR actor = ?)
      AND (? IS NULL OR sector = ?);
  `, [start, end, actor, actor, sector, sector]);
  return summary;
}

export async function getOutcomeComposition([start, end], actor, sector) {
  await initLaunchData();
  return query(`
    SELECT year, outcome, count(*) AS launches
    FROM launches
    WHERE year BETWEEN ? AND ?
      AND (? IS NULL OR actor = ?)
      AND (? IS NULL OR sector = ?)
    GROUP BY year, outcome
    ORDER BY year, outcome;
  `, [start, end, actor, actor, sector, sector]);
}

export async function getSites([start, end], actor, sector) {
  await initLaunchData();
  return query(`
    SELECT site_name, site_state, lat, lon, count(*) AS launches
    FROM launches
    WHERE year BETWEEN ? AND ? AND lat BETWEEN -90 AND 90
      AND lon BETWEEN -180 AND 180
      AND (? IS NULL OR actor = ?)
      AND (? IS NULL OR sector = ?)
    GROUP BY site_name, site_state, lat, lon
    ORDER BY launches DESC;
  `, [start, end, actor, actor, sector, sector]);
}

export async function getActorDetail([start, end], actor, sector) {
  await initLaunchData();
  if (!actor) return [];
  return query(`
    SELECT year, count(*) AS launches, avg(success_fraction) AS success_rate
    FROM launches
    WHERE year BETWEEN ? AND ? AND actor = ?
      AND (? IS NULL OR sector = ?)
    GROUP BY year
    ORDER BY year;
  `, [start, end, actor, sector, sector]);
}

export async function getActorOrigins([start, end], actor, sector) {
  await initLaunchData();
  if (!actor) return [];
  return query(`
    SELECT org_state, org_name, count(*) AS launches
    FROM launches
    WHERE year BETWEEN ? AND ? AND actor = ? AND org_state IS NOT NULL
      AND (? IS NULL OR sector = ?)
    GROUP BY org_state, org_name
    ORDER BY launches DESC
    LIMIT 5;
  `, [start, end, actor, sector, sector]);
}
