# Prompt da parte visual (UI)

Copie o bloco abaixo para o assistente de código. Ele implementa só a **identidade visual e o layout**, não as views.

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

2. TROCAR a paleta (só os tokens do :root) para "arquivo espacial":
   --color-bg:         #faf8f3   (mantém o creme)
   --color-surface:    #ffffff
   --color-border:     #e2e0da
   --color-text:       #1c2433   (azul-marinho quase preto)
   --color-text-muted: #5d6676
   --color-accent:     #1d3557   (azul-marinho: abas, links, bordas ativas)
   --color-highlight:  #d9622b   (laranja-foguete: SÓ para seleção/destaque)
   Regra: o acento é estrutura, o highlight é seleção. Nunca usar os dois
   para a mesma função.

3. Criar tokens de dados em src/shared/styles/palette.js (exportados para o D3):
   - categórica para atores (até 7 + "Outros" em cinza #b8b4aa): tons
     sóbrios que combinem com creme, distinguíveis por daltônicos e sem
     competir com o laranja de seleção. Sugestão inicial para validar:
     EUA #3b6ea5, URSS/Rússia #a23b3b, China #c99a2e, Europa #4f8a6e,
     Japão #7a5c99, Índia #2f8f9d, Privadas (pode ser por empresa) #6b7a8f
   - sequencial (mapa/intensidade): do creme #f1efe8 ao acento #1d3557
   - sucesso × falha: NÃO usar verde/vermelho. Sucesso em cor neutra,
     falha com marcador "✕" e/ou o laranja de destaque.
   - elementos não selecionados ficam com opacidade ~0.25 quando há seleção
     (linked highlighting).
   Validar o contraste do texto (WCAG AA) e simular daltonismo; ajustar os
   hex se necessário.

4. Layout em tela única (não usar mais abas por caso como no T1):
   ┌──────────────────────────────────────────────────────────┐
   │ Cabeçalho: título serifa + subtítulo + botão "Sobre os   │
   │ dados" + filtros globais (agrupar por país/operador)     │
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
