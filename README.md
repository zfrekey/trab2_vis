# Trabalho 02 · Sistema de Análise Visual de Dados

Visualização de Dados · Prof. Marcos Lage (UFF)

**Integrantes:** Filype Abreu, Felipe Gomes e Lucas Paixão.

## A ideia

Um dashboard interativo sobre **todos os lançamentos orbitais da história (1957–hoje)**: como a exploração espacial passou da disputa EUA × URSS para um cenário com China, Europa, Índia e empresas privadas como a SpaceX. Dá para explorar quem lança, de onde, com que taxa de sucesso e como isso mudou ao longo do tempo.

Feito com **D3.js** + **DuckDB-Wasm**, rodando 100% no navegador.

## Dados

- Lançamentos, bases e operadores: [GCAT, de Jonathan McDowell](https://planet4589.org/space/gcat/)
- Objetos lançados por país/ano: [Our World in Data](https://ourworldindata.org/grapher/yearly-number-of-objects-launched-into-outer-space)
- Mapa-múndi: [world-atlas](https://github.com/topojson/world-atlas)

Os arquivos já estão em `public/data/`.

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Documentos

- [PLANO.md](PLANO.md): escopo, requisitos e parte técnica
- [UI.md](UI.md): prompt da parte visual
- [COMENTARIOS.md](COMENTARIOS.md): prompt do padrão de comentários do código
