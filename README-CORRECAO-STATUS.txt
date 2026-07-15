Correção do status de sincronização

Problema corrigido:
- A data aparecia por um instante após o envio e depois voltava para
  "Nenhum backup enviado".

Causas:
- O parâmetro usado para evitar cache era interpretado pelo PostgREST como
  filtro de uma coluna inexistente.
- O service worker podia interceptar respostas externas do Supabase.

Correções:
- Consulta do último backup sem parâmetro inválido.
- Ordenação por updated_at decrescente.
- A data retornada pelo envio permanece na tela.
- Requisições ao Supabase não passam mais pelo cache do service worker.
- Cache do aplicativo atualizado.

Depois de publicar:
1. Substitua os arquivos no GitHub.
2. Abra o app com internet.
3. Feche e abra novamente.
4. Se ainda carregar a versão antiga, remova e adicione o atalho outra vez.
