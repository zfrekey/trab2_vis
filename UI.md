# Prompt da parte visual (UI)

Copie o bloco abaixo para o assistente de código. Ele implementa só a **identidade visual e o layout**, não as views.

> **Já aplicado no repositório:** os itens 2 e 3 (tokens de cor em `src/shared/styles/style.css` e cores dos dados em `src/shared/styles/palette.js`, com contraste e daltonismo validados). O assistente só precisa usá-los e fazer os itens 4 e 5.

---

```
Contexto: projeto Vite + D3.js + DuckDB-Wasm (sem React, sem bibliotecas de
visualização de alto nível). É um dashboard de visual analytics sobre
lançamentos espaciais orbitais (1957–hoje). Leia PLANO.md antes de começar.

Objetivo: adaptar o tema visual herdado do Trabalho 1 para o tema espacial,
mantendo o estilo e trocando as cores.

1. MANTER o estilo atual de src/shared/styles/style.css:
   - visual editorial: fundo creme, cartões brancos com borda fina, raio 6–8px
   - títulos em serifa (Georgia), corpo em sans do sistema
   - "eyebrow" (rótulo pequeno, caixa alta, letter-spacing 0.12em) acima dos títulos
   - escala de espaçamento --space-1 a --space-5, largura máxima 1100px
   - o tooltip e os botões existentes

2. [JÁ FEITO, só conferir] Paleta "arquivo espacial" nos tokens do :root:
   --color-bg:         #faf8f3   (mantém o creme)
   --color-surface:    #ffffff
   --color-border:     #e2e0da
   --color-text:       #1c2433   (azul-marinho quase preto)
   --color-text-muted: #5d6676
   --color-accent:     #1d3557   (azul-marinho: abas, links, bordas ativas)
   --color-highlight:  #d9622b   (laranja-foguete: SÓ para seleção/destaque)
   Regra: o acento é estrutura, o highlight é seleção. Nunca usar os dois
   para a mesma função.

3. [JÁ FEITO, só usar] Cores dos dados em src/shared/styles/palette.js
   (ACTOR_COLORS, SECTOR_COLORS, SEQUENTIAL, OUTCOME_MARKS, FADED_OPACITY):
   - categórica para os 7 atores (valores da coluna `actor`), validada
     (contraste >= 3,5:1 no fundo creme, checada em simulação de daltonismo):
     URSS/Rússia #a63a3a, EUA #0f5f9e, China #b5770d, Europa #2e7d4f,
     Japão #a3487f, Índia #00808a, Outros #b8b4aa (cinza, de propósito)
     Japão/Índia é o par mais próximo para daltônicos: ROTULAR AS SÉRIES
     DIRETAMENTE (texto na cor da série no fim da linha/área) em vez de
     depender só de legenda.
   - categórica para os setores (coluna `sector`):
     Comercial #b5770d, Civil #0f5f9e, Militar #5e5a52, Indefinido #d6d2c8
     (Comercial é a única cor quente de propósito: é a história da era comercial)
   - item selecionado mantém a própria cor com contorno em --color-highlight;
     o laranja não substitui a cor da série.
   - sequencial (mapa/intensidade): do creme #f1efe8 ao acento #1d3557
   - sucesso × falha (coluna `outcome`): NÃO usar verde/vermelho. Sucesso
     em cor neutra, falha com marcador "✕", parcial com marcador vazado,
     explosão na plataforma/aborto com marcador "△".
   - anotações de marcos históricos (src/data/milestones.js) na linha do
     tempo: linha vertical fina tracejada + rótulo pequeno em serifa
     itálica, estilo nota de rodapé de revista. Não podem competir com os
     dados (cor --color-text-muted, opacidade baixa).
   - elementos não selecionados ficam com opacidade ~0.25 quando há seleção
     (linked highlighting).

4. Layout em tela única (não usar mais abas por caso como no T1):
   ┌──────────────────────────────────────────────────────────┐
   │ Cabeçalho: título serifa + subtítulo + botão "Sobre os   │
   │ dados" + alternância global "Quem lança" / "Que setor"   │
   ├──────────────────────────────────────────┬───────────────┤
   │ Linha do tempo (área empilhada), largura │ Painel de     │
   │ total, com brush de anos                 │ detalhe do    │
   ├─────────────────────┬────────────────────┤ ator          │
   │ Curva de            │ Ranking            │ selecionado   │
   │ aprendizado         │ (busca + ordenar)  │ (sparklines)  │
   ├─────────────────────┴────────────────────┤               │
   │ Mapa das bases (desejável)               │               │
   └──────────────────────────────────────────┴───────────────┘
   - Cada view num cartão com eyebrow + título + uma frase "o que esta
     visualização responde" (ligada às perguntas do PLANO.md)
   - Uma barra de estado acima das views mostrando os filtros ativos
     ("1990–2010 · China selecionada · limpar"), para o usuário entender
     o efeito das interações
   - "Sobre os dados": painel/modal com propósito, como usar, fontes
     e limitações (texto vem do PLANO.md, seção 3)
   - Abaixo de ~900px, empilhar tudo em uma coluna (painel de detalhe vai
     para baixo)
   - Estados de loading e vazio em cada cartão ("Nenhum lançamento neste
     intervalo")

5. Restrições:
   - Só CSS puro + D3 para os gráficos. Nada de Tailwind, Plotly, Chart.js
     ou Vega.
   - Toda cor usada nos gráficos deve vir de palette.js ou de variáveis CSS
     (nada de hex solto nas views).
   - Comentar no código o porquê de cada escolha de cor/escala (vai para o
     relatório).

Entrega: style.css atualizado, palette.js, o layout em main.js com os cartões
vazios (placeholders) prontos para as views, e uma lista curta das decisões
de design tomadas, para o relatório.
```
