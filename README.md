# Órbita — uma história em lançamentos

Dashboard interativo de visual analytics sobre lançamentos espaciais orbitais,
de 1957 até o snapshot de outubro de 2026. A interface explora a transição da
corrida espacial para um ecossistema com vários países e operadores comerciais.

## Como executar

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

Abra o endereço local exibido pelo Vite. Para validar ou publicar:

```bash
npm run build
npm run preview
```

O dashboard e os arquivos de dados são servidos pelo Vite, mas o processamento
é feito no navegador: D3.js desenha os gráficos e DuckDB-Wasm consulta/agrega os
TSV/CSV localmente. Não há backend nem API em runtime.

## Como explorar

- Arraste sobre a linha do tempo para filtrar o período; todas as demais views
  respondem ao intervalo.
- Alterne entre **Quem lança** e **Que setor** para mudar a leitura da área
  empilhada.
- Selecione um ator na legenda ou clique em seu nome no ranking para coordenar
  destaque, mapa e painel de detalhe. Clique novamente para limpar a seleção.
- Use **Filtrar setor** para restringir ranking, composição de resultados, mapa
  e painel às categorias Comercial, Civil, Militar ou Indefinido. O gráfico de
  resultados também acompanha os filtros de ator e setor e mostra a composição
  percentual em blocos de três anos. A seleção de um ator dentro do setor
  continua disponível no ranking e no painel de detalhe.
- Todos os atores aparecem no ranking e podem ser selecionados com um clique.
  Ordene a lista por volume ou taxa de sucesso.
- Abra **Sobre os dados** para fontes, definições e limitações.

## Estrutura

```text
src/
├── data/                 # Carregamento, transformação e consultas DuckDB
├── shared/
│   ├── data/              # DuckDB-Wasm singleton
│   └── styles/            # Tema e paleta categórica comum às views
├── state/                 # Estado compartilhado de filtros e seleção
├── views/                 # Gráficos D3 coordenados
└── main.js                # Layout, interações globais e ciclo de atualização
public/data/               # Snapshot GCAT, OWID e geometria do mapa
docs/                      # Decisões visuais e notas sobre os dados
```

## Documentação

- [Decisões de design](docs/DECISOES.md)
- [Dados, preparação e limitações](docs/DADOS.md)
- [Plano do trabalho de referência](../trab2_vis/PLANO.md)

## Tecnologias e fontes

- D3.js 7 e DuckDB-Wasm para visualização, consulta e agregação no cliente.
- [GCAT — Jonathan McDowell](https://planet4589.org/space/gcat/)
- [Our World in Data — objetos lançados ao espaço](https://ourworldindata.org/grapher/yearly-number-of-objects-launched-into-outer-space)
- [world-atlas](https://github.com/topojson/world-atlas)
