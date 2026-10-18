# Plano do Trabalho 02

Documento técnico: o que o professor pede, o escopo que definimos e como implementar.

---

## 1. Requisitos do enunciado (checklist)

**Sistema**
- [ ] Propósito, público e perguntas definidos
- [ ] Fonte, atributos e limitações dos dados apresentados
- [ ] Tarefas de análise caracterizadas
- [ ] Visualizações que mostram aspectos diferentes e funcionam integradas
- [ ] Interações com função clara: filtragem, seleção, comparação, níveis de detalhe, coordenação
- [ ] Escolhas de design justificadas pela teoria vista em aula
- [ ] Exemplos de uso respondendo às perguntas

**Na própria aplicação**
- [ ] Propósito e orientação de uso visíveis
- [ ] Resposta visual clara a filtros e seleções
- [ ] Fonte dos dados e limitações visíveis

**Técnico**
- [ ] Visualizações em **D3.js** (proibido: Plotly, Chart.js, Vega-Lite, Observable Plot)
- [ ] **DuckDB-Wasm** usado de verdade para consulta, transformação e agregação
- [ ] Tudo no navegador: sem backend, sem API, sem banco remoto (servidor estático é permitido)
- [ ] Código comentado, principalmente as queries, as visualizações e as interações
- [ ] Instruções de execução e de acesso aos dados (README)
- [ ] Usar os códigos de sala como base (já feito: `src/shared/` veio do T1)

**Relatório (6 seções)**
- [ ] Introdução: propósito, público, motivação e perguntas
- [ ] Dados e tarefas: fonte, atributos, preparação, limitações e tarefas
- [ ] Interface e decisões de design: marcas, canais, escalas, cores, layout, coordenação, alternativas e trade-offs
- [ ] Implementação: estrutura e como D3 e DuckDB se ligam às interações
- [ ] Exemplos de uso: percursos com prints
- [ ] Discussão final: o que atende, limitações, melhorias e aprendizados

> O foco da avaliação é **representação, interface e interação**, não eficiência computacional. Mais interações não significa nota maior: cada uma precisa servir a uma tarefa.

---

## 2. Escopo

**Tema:** da corrida espacial à era comercial.

**Propósito:** permitir explorar como a exploração espacial passou da disputa entre duas potências para um ecossistema com dezenas de países e empresas privadas.

**Público:** estudantes e pessoas curiosas sobre tecnologia e história, sem conhecimento técnico de astronáutica.

**Perguntas**
1. Como o protagonismo mudou ao longo das décadas (EUA/URSS → China → empresas privadas)?
2. Os países e empresas "aprendem"? A taxa de sucesso melhora com o número de lançamentos?
3. Onde ficam as bases de lançamento, e como a geografia mudou?
4. O que explica a explosão de lançamentos recente?

**Tarefas (Munzner: ação + alvo)**

| # | Tarefa | Pergunta | View principal |
|---|---|---|---|
| T1 | Acompanhar tendência temporal | 1, 4 | Linha do tempo |
| T2 | Comparar atores (países/blocos) e setores (comercial, civil, militar) | 1, 2, 4 | Ranking + linha do tempo |
| T3 | Descobrir correlação (experiência × sucesso) | 2 | Curva de aprendizado |
| T4 | Identificar outliers (anos de falhas, picos) | 2, 4 | Curva + linha do tempo |
| T5 | Localizar e comparar bases | 3 | Mapa |
| T6 | Consultar um ator específico (lookup) | todas | Busca + painel de detalhe |

**Obrigatório (MVP)**
- Store de estado compartilhado: intervalo de anos, ator(es) selecionado(s), modo de cor (**ator** ou **setor**)
- **Linha do tempo** em área empilhada, com brush de anos que filtra tudo
  - alternância "Quem lança" (ator) / "Que setor" (comercial, civil, militar): a mesma área conta duas histórias, a geopolítica e a comercial
  - **anotações de marcos históricos** (`src/data/milestones.js`: Sputnik, Gagarin, fim da URSS, 1º pouso do Falcon 9, Starlink…) para o público leigo ligar picos e quedas a eventos reais
- **Curva de aprendizado**: nº acumulado de lançamentos (X, escala log) × taxa de sucesso acumulada (Y), uma linha por ator. É a view mais original do sistema: mostra quem "aprende" mais rápido
- **Ranking** de atores no intervalo selecionado, ordenável, com busca
- Linked highlighting: selecionar um ator em uma view destaca nas outras
- Cada filtro dispara uma query no DuckDB
- Tela de contexto: propósito, como usar, fonte e limitações
- Tooltip e legendas

**Desejável**
- Mapa das bases (pontos, área ∝ nº de lançamentos) com clique para filtrar
- Painel de detalhe com sparklines do ator selecionado
- Curva de aprendizado também por foguete (Falcon 9 × Soyuz × Longa Marcha)
- Cruzamento com OWID: nº de objetos em órbita × nº de lançamentos (mostra o efeito das megaconstelações)

**Fora de escopo**
- Lançamentos suborbitais e testes de mísseis (o GCAT tem, nós filtramos)
- Previsão ou modelos estatísticos
- Dados de satélites individuais
- Mobile completo

---

## 3. Dados

| Arquivo (`public/data/`) | Fonte | O que tem |
|---|---|---|
| `launch.tsv` | [GCAT](https://planet4589.org/space/gcat/) | ~76 mil lançamentos (todos os tipos); filtramos 7.196 orbitais |
| `sites.tsv` | GCAT | bases de lançamento com latitude/longitude e país |
| `orgs.tsv` | GCAT | operadores e agências, com país e classe |
| `owid-space-objects.csv` | [OWID](https://ourworldindata.org/grapher/yearly-number-of-objects-launched-into-outer-space) | objetos lançados por país e ano |
| `world-atlas-50m.json` | [world-atlas](https://github.com/topojson/world-atlas) | geometria dos países (para o mapa) |

**Colunas principais do `launch.tsv`**
- `Launch_Date`: texto no formato `"1957 Oct  4 1928:34"` (o ano são os 4 primeiros caracteres)
- `LV_Type`: foguete
- `Launch_Site`: chave para `sites.Site`
- `Agency`: chave para `orgs.Code`; pode ter vários operadores (`"SPOG/AVKO"`), usamos o primeiro
- `LaunchCode`: 1ª letra é o tipo (`O` = orbital) e 2ª o resultado (`S` = sucesso, `F` = falha, `U` = incerto)

**Já implementado** em `src/data/launchesRepository.js`, e validado: as tabelas `launches`, `sites`, `orgs` e `owid_objects`.
- Os TSVs têm 2 linhas de cabeçalho; lemos com `skip=2` e os nomes das colunas passados na mão.
- Joins: só 1 lançamento fica sem base e 4 ficam sem operador.
- A tabela `launches` já vem pronta para as views: `year`, `jd`, `vehicle`, `org_name`, `actor`, `sector`, `site_name`, `lat`, `lon`, `outcome` e `success_fraction`.

**Decisões de dados (tomadas, documentar no relatório)**

| Decisão | Escolha | Por quê |
|---|---|---|
| A quem atribuir o lançamento | País do **operador** (quem lança), não da base | A pergunta é sobre protagonismo. A geografia (de onde se lança) aparece no mapa, então as duas leituras existem no sistema sem misturar |
| URSS × Rússia | Uma **linhagem** só, "URSS/Rússia", com o fim da URSS anotado em 1991 | Mesmo programa, bases e foguetes (Soyuz). Separar criaria uma "queda" artificial em 1991. A anotação preserva a informação histórica |
| Países europeus | Agrupados em **"Europa"** (França, Alemanha, Itália, Reino Unido, ESA, ELDO) | Quase tudo é Arianespace/ESA; separados, cada um seria invisível |
| Atores pequenos | **"Outros"** (Irã, Israel, Coreias, Nova Zelândia/Rocket Lab, Brasil…) | Limita a paleta a 7 cores; o painel de detalhe mostra o país real (`org_state`) |
| Setor | Classe do operador no GCAT: B = **Comercial**, C = **Civil**, D = **Militar** | Responde direto à pergunta da "era comercial" (2020s: 1.124 comerciais × 301 civis × 48 militares) |
| Sucesso | **Fração de sucesso** do McDowell: `OS` = 1, `OF` = 0, `OS80` = 0,8, `OF40` = 0,4 | Conta sucesso parcial de forma justa (115 casos), como na literatura de confiabilidade de foguetes |
| Explosão na plataforma (`OE`) e aborto (`OA`) | **Fora da taxa** (`success_fraction` = NULL), mas mantidos como `outcome` | Não chegaram a voar (17 casos). Podem aparecer como marcador especial |

Números atuais: 7.196 lançamentos orbitais, taxa média de 93,3%. Por ator: URSS/Rússia 3.284, EUA 2.348, China 795, Europa 384, Outros 149, Japão 136 e Índia 100.

**Limitações (para o relatório e a tela de contexto)**
- O GCAT é mantido por uma pessoa só; classificações podem mudar entre versões.
- O "país" de um lançamento é ambíguo (base, operador ou cliente). Kourou fica na Guiana Francesa, mas os lançamentos são europeus, e a Rocket Lab aparece como `NZ`. Usamos o operador (ver decisões acima).
- Juntar URSS e Rússia e agrupar a Europa são escolhas nossas; quem quiser o país original vê no painel de detalhe.
- A classe do operador (comercial/civil/militar) é a classificação do GCAT. Empresas estatais chinesas e russas podem estar como "comercial".
- "Sucesso" no GCAT é **propulsivo**: o foguete chegou à órbita, mesmo que a carga tenha falhado depois.
- Os dados do OWID contam **objetos**, não lançamentos: um lançamento da Starlink coloca dezenas.
- Snapshot do GCAT de 17/10/2026.

---

## 4. Arquitetura

```
src/
├── shared/          # veio do T1: duckdb.js, tooltip.js, format.js, style.css
├── data/            # launchesRepository.js (tabelas), milestones.js (marcos) + queries das views
├── state/           # store central (pub/sub): anos, seleção, agrupamento
├── views/           # timeline.js, learningCurve.js, ranking.js, sitesMap.js, detailPanel.js
└── main.js          # monta o layout único e conecta store ↔ views
```

**Fluxo:** interação → `store.set(...)` → store avisa as views → cada view roda sua query no DuckDB com os filtros atuais → redesenha com D3.

Esboço do store:

```js
// state/store.js
const state = { years: [1957, 2026], selected: new Set(), colorBy: "actor" }; // colorBy: "actor" | "sector"
const listeners = new Set();
export const getState = () => state;
export function setState(patch) { Object.assign(state, patch); listeners.forEach((fn) => fn(state)); }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
```

Exemplos de query:

```sql
-- linha do tempo: lançamentos por ano e por ator
SELECT year, actor, count(*) AS n      -- ou "sector" no lugar de "actor"
FROM launches
GROUP BY ALL ORDER BY year;

-- curva de aprendizado: sucesso acumulado por ator
SELECT actor, year,
       row_number() OVER w AS launches_so_far,
       avg(success_fraction) OVER w AS success_rate_so_far
FROM launches
WHERE success_fraction IS NOT NULL
WINDOW w AS (PARTITION BY actor ORDER BY jd);

-- ranking no intervalo do brush
SELECT actor, count(*) AS n, avg(success_fraction) AS rate
FROM launches
WHERE year BETWEEN ? AND ?
GROUP BY ALL ORDER BY n DESC;
```

> Cuidado: a taxa usa `success_fraction` (que já trata sucesso parcial); não use `outcome = 'sucesso'`.
>
> Cuidado: `date_raw` é texto e não ordena corretamente dentro do ano (`"Apr" < "Jan"`). Para ordem cronológica, use `jd` (data juliana, numérica).

---

## 5. Divisão

| Pessoa | Responsabilidade |
|---|---|
| 1 | Dados + DuckDB: queries das views, tela de contexto com as decisões de dados |
| 2 | Store + layout + linha do tempo + curva de aprendizado |
| 3 | Ranking + mapa + painel de detalhe |
| Todos | Relatório (cada um escreve sua parte) e exemplos de uso |

---

## 6. Cronograma

1. ~~Fechar decisões de dados~~ (feito, ver seção 3)
2. Store + layout + 2 views conectadas (linha do tempo + ranking)
3. Curva de aprendizado, mapa e painel de detalhe
4. Polimento: loading, estados vazios, legendas, comentários
5. Exemplos de uso: 2 ou 3 percursos com prints
6. Relatório + README final

> Durante o desenvolvimento, anotem as **alternativas descartadas e os porquês**. Isso vira a seção "Interface e decisões de design" e é difícil de lembrar depois.
