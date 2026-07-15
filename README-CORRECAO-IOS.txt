Correção para campos de texto no iPhone

A verificação do backup automático não usa mais visibilitychange.
No iOS/PWA, mudanças de foco e abertura do teclado podem disparar eventos
de ciclo de vida. A verificação agora ocorre em pageshow, retorno da internet
e abertura do app, sempre ignorando a execução enquanto um input, textarea
ou select está com foco.

O cache do service worker também foi atualizado.
