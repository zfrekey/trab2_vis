import { registerLocalFile, query } from "../shared/data/duckdb.js";

// arquivos do GCAT (Jonathan McDowell) + OWID, servidos estaticos de public/data
const FILES = {
  launch: "launch.tsv",
  sites: "sites.tsv",
  orgs: "orgs.tsv",
  owid: "owid-space-objects.csv",
};

// os tsv do GCAT tem 2 linhas de cabecalho (nomes com "#" + "# Updated ...")
// entao pulamos as duas e passamos os nomes das colunas na mao
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

function readGcat(file, cols) {
  const names = cols.map((c) => `'${c}'`).join(", ");
  return `read_csv('${file}', delim='\\t', header=false, skip=2, all_varchar=true,
    quote='', null_padding=true, names=[${names}])`;
}

let initPromise = null;

// cria as tabelas limpas no duckdb uma unica vez
// launches: so lancamentos orbitais (LaunchCode comeca com "O"), com ano e sucesso
export function initLaunchData() {
  if (!initPromise) {
    initPromise = (async () => {
      const base = `${import.meta.env.BASE_URL}data/`;
      await Promise.all(
        Object.values(FILES).map((f) => registerLocalFile(f, base + f)),
      );

      await query(`
        CREATE TABLE IF NOT EXISTS sites AS
        SELECT trim(Site) AS site, trim(ShortName) AS site_name,
               trim(StateCode) AS site_state,
               TRY_CAST(trim(Latitude) AS DOUBLE) AS lat,
               TRY_CAST(trim(Longitude) AS DOUBLE) AS lon
        FROM ${readGcat(FILES.sites, SITE_COLS)};
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS orgs AS
        SELECT trim(Code) AS org, trim(ShortName) AS org_name,
               trim(StateCode) AS org_state, trim(Class) AS org_class
        FROM ${readGcat(FILES.orgs, ORG_COLS)};
      `);

      // Launch_Date vem como "1957 Oct  4 1928:34", o ano sao os 4 primeiros chars
      // jd (data juliana) e numerico, usar ele pra ordenar cronologicamente
      // Agency pode ter varios operadores ("SPOG/AVKO"), usamos o primeiro
      await query(`
        CREATE TABLE IF NOT EXISTS launches AS
        SELECT trim(Launch_Tag) AS tag,
               CAST(substr(trim(Launch_Date), 1, 4) AS INTEGER) AS year,
               trim(Launch_Date) AS date_raw,
               TRY_CAST(trim(Launch_JD) AS DOUBLE) AS jd,
               trim(LV_Type) AS vehicle,
               trim(Launch_Site) AS site,
               split_part(trim(Agency), '/', 1) AS org,
               trim(LaunchCode) AS launch_code,
               trim(LaunchCode) LIKE 'OS%' AS success
        FROM ${readGcat(FILES.launch, LAUNCH_COLS)}
        WHERE trim(LaunchCode) LIKE 'O%';
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS owid_objects AS
        SELECT Entity AS entity, Code AS iso3, Year AS year,
               "Annual number of objects launched into outer space" AS objects
        FROM read_csv_auto('${FILES.owid}');
      `);
    })();
  }
  return initPromise;
}

export async function getSummary() {
  await initLaunchData();
  const [row] = await query(`
    SELECT count(*) AS total, min(year) AS first_year, max(year) AS last_year,
           avg(success::INTEGER) AS success_rate
    FROM launches;
  `);
  return row;
}
