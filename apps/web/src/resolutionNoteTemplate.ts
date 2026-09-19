// Modelo sugerido pro campo de mensagem de resolução, no padrão de resposta
// formal de gestão pública (quem resolveu, causa, solução) — ver decisão no
// histórico de conversas do projeto (extensão do item 8 do CLAUDE.md).
// Deliberadamente sem nenhum dado pré-preenchido (ex.: secretaria inferida
// da categoria do problema): a app não tem informação confiável sobre qual
// órgão realmente resolveu, então sugerir um nome seria inventar dado —
// fica com placeholder genérico, o gestor preenche à mão.
export const RESOLUTION_NOTE_TEMPLATE =
  'Resolvido por [preencher]. Causa do problema: [preencher]. Solução aplicada: [preencher].';
