# Interface e decisões de design

## Identidade visual

- Mantivemos o fundo creme, cartões brancos, borda fina e raio discreto do
  Trabalho 1. Georgia nos títulos e sans-serif de sistema no restante mantêm a
  hierarquia editorial sem competir com os dados.
- Azul-marinho é o acento estrutural da interface; laranja é reservado para
  seleção e brush. As cores categóricas dos atores e setores vêm de uma paleta
  única para que uma categoria não mude de significado entre views.
- Os cartões usam eyebrow, título e uma frase que declara a pergunta analítica.
  A composição em uma tela conecta overview temporal, comparação, aprendizado,
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
- O filtro de setor restringe ranking, curva de aprendizado, mapa e detalhe.
  Quando a linha do tempo está colorida por setor, a área correspondente fica
  destacada; no ranking ainda é possível selecionar um ator dentro do setor.
- O ranking ordenável usa comprimento de barra para volume e texto para taxa.
  A busca atende à tarefa de lookup sem depender da memorização da cor.
- A curva relaciona experiência acumulada à taxa de sucesso parcial acumulada.
  X é logarítmico porque os atores têm volumes muito diferentes; usamos
  segmentos retos e marcações diretas para não sugerir valores não observados.
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

- Uma escala linear no gráfico de aprendizado esconderia os atores de menor
  volume; por isso usamos log no eixo de experiência e o declaramos na tela.
- Não codificamos sucesso e falha por verde/vermelho. A taxa é apresentada como
  valor quantitativo e as categorias do gráfico mantêm sua identidade.
- O mapa mostra bases, não fronteiras coloridas: a questão é geográfica e o
  operador não deve ser confundido com o país onde a base está localizada.
