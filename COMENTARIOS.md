# Prompt do padrão de comentários

O enunciado exige código comentado, "especialmente nos trechos relacionados às consultas, às visualizações e às interações". Este é o padrão que usamos no Trabalho 1, antes da limpeza final. Copie o bloco abaixo para o assistente de código sempre que criar ou revisar um arquivo.

---

```
Comente o código seguindo o padrão do Trabalho 1. Regras:

IDIOMA E TOM
- Português, com acentos, frases completas com inicial maiúscula e ponto final.
- Tom técnico e direto, na primeira pessoa do plural implícita ("usamos",
  "evitamos") ou impessoal. Sem gírias, sem emojis.
- Termos técnicos podem ficar em inglês quando é o nome usado na área
  (brush, data join, tooltip, hover, snapshot).

FORMATO
- JS: comentários de linha `//` em bloco ACIMA do trecho, nunca no fim da
  linha. Quebrar em ~80 colunas.
- Arquivos de dados e módulos: um bloco no topo dizendo o papel do arquivo.
  Ex.: "// Todo o SQL de lançamentos fica aqui, separado do código de desenho."
- Seções grandes de um arquivo (raramente):
  // ==========================================
  // NOME DA SEÇÃO
  // ==========================================
- CSS: cabeçalho por arquivo e por bloco:
  /* Estilos da linha do tempo */
  /* --- Brush --- */
- Rótulos curtos são aceitos para passos óbvios de D3 ("// Eixo X",
  "// Legenda", "// Overlay de hover"), mas NÃO substituem o porquê nos
  trechos importantes.

O QUE COMENTAR (prioridade)
1. O PORQUÊ, não o quê. Explique a decisão e a alternativa descartada:
   "Segmentos retos (curva linear), de propósito: uma curva suave como
    Catmull-Rom sugeriria valores entre observações que não existem no
    dataset; aqui a clareza analítica importa mais que a estética."
2. Decisões de design com vocabulário da disciplina (marca, canal, escala,
   domínio, cor categórica/sequencial/divergente, overview+detail,
   linked highlighting):
   "Posição é o único canal que carrega dado (sem tamanho variável)."
   "Domínio fixo (histórico completo, não só o intervalo atual): os eixos
    não mudam a cada brush e as comparações continuam válidas."
3. Queries SQL: o que a consulta entrega para a view e por que a
   transformação é feita no DuckDB:
   "Taxa acumulada calculada em SQL com window function (derivação de
    dados evidenciada no DuckDB), não em JS."
4. Interações: o que a ação do usuário muda no estado e quais views reagem:
   "Clicar no ator já selecionado desmarca a seleção."
   "O histórico só é buscado quando a seleção MUDA, não a cada hover."
5. Tratamento de dados e exceções conhecidas:
   "Lançamentos sem operador (4) entram em 'Outros' em vez de serem
    descartados."
6. Data joins do D3: qual a chave e o que acontece na atualização:
   "Data join pela chave `actor`: a cada brush as áreas fazem transição,
    nunca são recriadas."

O QUE NÃO FAZER
- Não narrar o óbvio ("// cria uma variável", "// faz um loop").
- Não deixar código comentado, TODO solto ou comentário desatualizado.
- Não usar comentário no fim da linha.
- Não usar JSDoc completo (@param/@returns), salvo em funções exportadas
  com parâmetros não óbvios.

Exemplos reais do Trabalho 1 (use como referência de tom):

// Natural Earth: projeção pensada para mapas temáticos do mundo todo,
// ao contrário da Mercator, que distorce muito a área em altas latitudes.

// País sem observação recebe hachura diagonal em vez de cor sólida, para
// não ser confundido visualmente com "valor perto de zero".

// "has-focus" escurece os demais pontos quando há hover OU seleção: o
// ponto em foco fica destacado, o resto perde opacidade (não muda de cor).

// Idempotente: o CSV só é buscado e parseado uma vez, mesmo chamado por
// vários gráficos.

Quando terminar, liste em tópicos as decisões de design que você comentou:
elas vão para a seção "Interface e decisões de design" do relatório.
```
