# Interface e decisões de design

## Identidade visual

- Mantivemos o fundo creme, cartões brancos, borda fina e raio discreto do
  Trabalho 1. Georgia nos títulos e sans-serif de sistema no restante mantêm a
  hierarquia editorial sem competir com os dados.
- Azul-marinho é o acento estrutural da interface; laranja é reservado para
  seleção e brush. As cores categóricas dos atores, setores e resultados vêm de
  uma paleta única para que uma categoria não mude de significado entre views.
- Os cartões usam eyebrow, título e uma frase que declara a pergunta analítica.
  A composição em uma tela conecta panorama temporal, comparação, resultados,
  localização e detalhe.
- Em telas menores, os cartões empilham em uma coluna; os filtros permanecem
  disponíveis e as views mantêm seus rótulos.

## Marcas, canais e escalas

- A área empilhada mostra volume anual e sua composição por ator ou setor. A
  mesma posição horizontal codifica o ano nos dois modos, enquanto a cor muda
  para responder a duas perguntas diferentes.
- O brush seleciona um intervalo temporal. O intervalo é explicitado na barra
  de estado e atualiza ranking, bases e detalhe; o domínio histórico completo
  da linha do tempo permanece fixo para preservar comparabilidade.
- O filtro de setor restringe ranking, composição de resultados, mapa e detalhe.
  Quando a linha do tempo está colorida por setor, a área correspondente fica
  destacada; no ranking ainda é possível selecionar um ator dentro do setor.
- O ranking ordenável usa comprimento de barra para volume e texto para taxa.
  A busca atende à tarefa de lookup sem depender da memorização da cor.
- O gráfico de resultados agrupa lançamentos em blocos de três anos. Um painel
  mostra a taxa de sucesso sobre todos os lançamentos; outro compara entre si
  as categorias diferentes de sucesso, sem comprimi-las pela predominância dos
  sucessos. O tooltip informa contagens e percentuais nos dois denominadores.
- No mapa, posição geográfica localiza a base e área do círculo representa
  volume no período. A cor é mantida neutra para não confundir base (onde) com
  ator (quem).
- A sparkline de detalhe preserva escala local por ator, enquanto os gráficos
  comparativos usam escalas comuns.

## Interação coordenada

- O estado compartilhado contém intervalo de anos, ator selecionado e dimensão
  de cor. Selecionar o ator no ranking ou na legenda destaca a mesma categoria
  nas views pertinentes; clicar novamente desfaz a seleção.
- Quando há seleção, as séries não selecionadas perdem opacidade, mas mantêm
  sua cor. Isso evita que o estado de foco seja confundido com outra categoria.
- O diálogo “Sobre os dados” explica propósito, uso, fonte e limitações sem
  retirar o painel de contexto do fluxo principal.

## Alternativas e trade-offs

- A composição percentual facilita comparar períodos com volumes muito
  diferentes; as quantidades absolutas permanecem disponíveis no tooltip para
  contextualizar percentuais baseados em poucos lançamentos.
- A paleta semântica diferencia sucesso, resultados parciais e demais
  categorias; percentuais e contagens mantêm a magnitude explícita.
- O mapa mostra bases, não fronteiras coloridas: a questão é geográfica e o
  operador não deve ser confundido com o país onde a base está localizada.
