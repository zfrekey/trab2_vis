# Interface e decisões de design

## Identidade visual

- Mantivemos o fundo creme, cartões brancos, borda fina e raio discreto do
  Trabalho 1. Georgia nos títulos e sans-serif de sistema no restante mantêm a
  hierarquia editorial sem competir com os dados.
- Azul-marinho é o acento estrutural da interface; laranja marca seleções e o
  brush usa cinza semitransparente para não competir com as séries. As cores
  categóricas dos atores, setores e resultados vêm de uma paleta única para que
  uma categoria não mude de significado entre views.
- Os cartões usam eyebrow, título e uma frase que declara a pergunta analítica.
  A composição em uma tela conecta panorama temporal, comparação, resultados,
  localização e detalhe.
- Em telas menores, os cartões empilham em uma coluna; os filtros permanecem
  disponíveis e as views mantêm seus rótulos.

## Marcas, canais e escalas

- As linhas mostram o volume anual separadamente por ator ou setor, sem áreas
  sobrepostas esconderem séries menores. A mesma posição horizontal codifica o
  ano nos dois modos; filtros destacam sua linha e reduzem a opacidade das
  demais. O eixo Y começa em zero, no encontro com o eixo X; os valores negativos
  e a margem visual abaixo de zero foram removidos.
- O brush seleciona um intervalo temporal. O intervalo é explicitado na barra
  de estado e atualiza ranking, bases e detalhe; o domínio histórico completo
  da linha do tempo permanece fixo para preservar comparabilidade.
- O filtro de setor restringe ranking, composição de resultados, mapa e detalhe.
  Quando a linha do tempo está colorida por setor, a linha correspondente fica
  destacada; no ranking ainda é possível selecionar um ator dentro do setor.
- O ranking ordenável usa comprimento de barra para volume e texto para taxa.
  A busca atende à tarefa de lookup sem depender da memorização da cor.
- O gráfico de resultados agrupa lançamentos em blocos de três anos. O painel
  superior mostra sucesso e não sucesso sobre todos os lançamentos. O painel
  inferior mostra a composição relativa das categorias de não sucesso, com
  marcas de 20 pontos percentuais e legenda própria logo abaixo do eixo X.
  Ambos os painéis repetem os intervalos no
  eixo X; o superior usa marcas de 25 pontos percentuais.
- No mapa, posição geográfica localiza a base e área do círculo representa
  volume no período. A cor é mantida neutra para não confundir base (onde) com
  ator (quem).
- A sparkline de detalhe preserva escala local por ator, enquanto os gráficos
  comparativos usam escalas comuns.

## Interação coordenada

- O estado compartilhado contém intervalo de anos, ator selecionado e dimensão
  de cor. Selecionar o ator no ranking ou na legenda destaca a mesma categoria
  nas views pertinentes; clicar novamente desfaz a seleção.
- Quando há seleção, a série correspondente ganha espessura e as demais perdem
  opacidade, mas mantêm suas cores. Isso preserva a identidade das categorias e
  destaca o foco sem confundi-lo com outra série.
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
