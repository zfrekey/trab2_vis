# Dados, preparação e limitações

## Arquivos incluídos

| Arquivo | Fonte | Uso |
|---|---|---|
| `launch.tsv` | GCAT | Lançamentos orbitais, operadores, código de resultado e foguete |
| `sites.tsv` | GCAT | Nome, país e coordenadas das bases |
| `orgs.tsv` | GCAT | País e classe do operador |
| `owid-space-objects.csv` | Our World in Data | Contagem anual de objetos colocados em órbita |
| `world-atlas-50m.json` | world-atlas | Geometria dos países no mapa |

O snapshot GCAT incluído é de 17/10/2026. Os arquivos estão em
`public/data/` e são consultados no navegador; os TSVs GCAT têm duas linhas de
cabeçalho e são lidos como texto antes da conversão explícita dos tipos.

## Preparação

- Apenas registros orbitais (código começando com `O`) entram na tabela de
  lançamentos. Quando há vários operadores, usamos o primeiro código.
- O ator é derivado do país do operador. SU e RU são agrupados em
  **URSS/Rússia**, países europeus selecionados em **Europa** e atores de baixo
  volume em **Outros**.
- Setor usa a classe GCAT: B comercial, C civil, D militar; demais casos são
  Indefinido.
- O painel de detalhe lista os principais operadores e códigos de país GCAT do
  ator selecionado, preservando parte da informação original após os
  agrupamentos.
- O resultado é preservado em categorias. A fração de sucesso usa 1 para
  sucesso, 0 para falha e a fração indicada pelo GCAT para resultados parciais.
  Explosões na plataforma, abortos e resultados incertos não entram na taxa.
- A composição de resultados é consultada por ano e categoria no DuckDB-Wasm e
  reagrupada em blocos de três anos na visualização. Sucessos são comparados
  com todos os lançamentos; as demais categorias são normalizadas entre si.
  Os filtros de período, ator e setor são aplicados antes da agregação.

## Limitações

- O GCAT é mantido por uma pessoa e suas classificações podem mudar.
- “País” pode referir-se à base, ao operador ou ao cliente. A atribuição por
  operador é uma escolha analítica; o mapa mostra a localização da base.
- Agrupar URSS/Rússia e Europa facilita a comparação, mas oculta diferenças
  entre países. O agrupamento “Outros” também agrega programas distintos.
- A classificação comercial/civil/militar é a do GCAT; operadores estatais
  podem aparecer como comerciais.
- Sucesso é propulsivo: significa que o veículo chegou à órbita, não que a
  carga cumpriu a missão.
- O OWID conta objetos e não lançamentos; uma única missão pode liberar vários
  objetos. Essa série está incluída como referência de dados, mas não é
  misturada à contagem de lançamentos deste dashboard.
