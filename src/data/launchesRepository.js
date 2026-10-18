import { registerLocalFile, query } from "../shared/data/duckdb.js";

// Todo o carregamento e a limpeza dos dados de lançamentos ficam aqui,
// separados do código de desenho. As views só consultam as tabelas prontas.

// Arquivos do GCAT (Jonathan McDowell) e do OWID, servidos estáticos de
// public/data (sem backend, como exige o enunciado).
const FILES = {
  launch: "launch.tsv",
  sites: "sites.tsv",
  orgs: "orgs.tsv",
  owid: "owid-space-objects.csv",
};

// Os TSVs do GCAT têm 2 linhas de cabeçalho (nomes com "#" e "# Updated ..."),
// o que confunde a detecção automática do DuckDB. Por isso pulamos as duas e
// passamos os nomes das colunas explicitamente.
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

// Tudo é lido como texto (all_varchar) porque o GCAT usa "-" para vazio e
// alinha números com espaços; a conversão de tipos é feita depois, com TRY_CAST.
function readGcat(file, cols) {
  const names = cols.map((c) => `'${c}'`).join(", ");
  return `read_csv('${file}', delim='\\t', header=false, skip=2, all_varchar=true,
    quote='', null_padding=true, names=[${names}])`;
}

let initPromise = null;

// Idempotente: os arquivos só são buscados e as tabelas só são criadas uma
// vez, mesmo que várias views chamem esta função.
// `launches` contém só lançamentos orbitais (LaunchCode começa com "O") e já
// vem desnormalizada, com ator, setor, base e sucesso, para que as queries
// das views sejam simples agregações.
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

      // Launch_Date vem como "1957 Oct  4 1928:34"; o ano são os 4 primeiros
      // caracteres. Para ordem cronológica usamos `jd` (data juliana), porque o
      // texto não ordena corretamente dentro do ano ("Apr" < "Jan").
      // Agency pode ter vários operadores ("SPOG/AVKO"); usamos o primeiro.
      //
      // Decisões de dados (justificativas no PLANO.md, seção 3):
      // - Ator é o país do OPERADOR (quem lança), não o da base (de onde se
      //   lança). A geografia continua visível no mapa das bases.
      // - SU e RU viram uma linhagem só, "URSS/Rússia": mesmo programa, bases e
      //   foguetes. Separar criaria uma queda artificial em 1991.
      // - Países europeus, ESA e ELDO viram "Europa"; atores com pouco volume
      //   viram "Outros", limitando a paleta categórica a 7 cores.
      // - Setor vem da classe do operador no GCAT: B comercial, C civil, D militar.
      // - Sucesso usa a "fração de sucesso" do McDowell: OS = 1, OF = 0,
      //   OS80 = 0,8, OF40 = 0,4 (sucesso parcial). OE (explosão na plataforma)
      //   e OA (aborto) não chegaram a voar, então ficam fora da taxa (NULL).
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
