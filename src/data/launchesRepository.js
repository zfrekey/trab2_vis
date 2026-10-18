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
// launches: so lancamentos orbitais (LaunchCode comeca com "O"), ja com ator, setor, base e sucesso
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
      //
      // decisoes de dados (justificativas no PLANO.md, secao 3):
      // - ator = pais do OPERADOR (quem lanca), nao da base (de onde lanca)
      // - SU e RU viram uma linhagem so, "URSS/Rússia" (mesmo programa, bases e foguetes)
      // - paises europeus + ESA/ELDO viram "Europa"; o resto com pouco volume vira "Outros"
      // - setor vem da classe do operador: B comercial, C civil, D militar
      // - sucesso usa a "fracao de sucesso" do McDowell: OS = 1, OF = 0,
      //   OS80 = 0.8, OF40 = 0.4 (sucesso parcial). OE (explosao na plataforma)
      //   e OA (aborto) nao chegaram a voar, entao ficam fora da taxa (NULL)
      await query(`
        CREATE TABLE IF NOT EXISTS launches AS
        WITH raw AS (
          SELECT trim(Launch_Tag) AS tag,
                 CAST(substr(trim(Launch_Date), 1, 4) AS INTEGER) AS year,
                 trim(Launch_Date) AS date_raw,
                 TRY_CAST(trim(Launch_JD) AS DOUBLE) AS jd,
                 trim(LV_Type) AS vehicle,
                 trim(Launch_Site) AS site,
                 split_part(trim(Agency), '/', 1) AS org,
                 trim(LaunchCode) AS launch_code,
                 substr(trim(LaunchCode), 2, 1) AS result_letter,
                 TRY_CAST(substr(trim(LaunchCode), 3) AS INTEGER) AS result_pct
          FROM ${readGcat(FILES.launch, LAUNCH_COLS)}
          WHERE trim(LaunchCode) LIKE 'O%'
        )
        SELECT r.tag, r.year, r.date_raw, r.jd, r.vehicle, r.launch_code,
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
           avg(success_fraction) AS success_rate
    FROM launches;
  `);
  return row;
}
