APPS COM SINCRONIZAÇÃO MANUAL SUPABASE

Pastas:
- gerenciador_despesas
- organizador_pessoal

CONFIGURAÇÃO
1. No Supabase, execute supabase.sql no SQL Editor.
2. Em cada app, abra config.js.
3. Informe a Project URL e a Publishable key do MESMO projeto Supabase.
4. Nunca use service_role ou secret key.
5. Publique os arquivos no GitHub Pages.
6. Abra a aba Sincronização e crie uma conta ou entre.

COMPORTAMENTO
- Cadastros continuam sendo salvos localmente e funcionam offline.
- Nada é enviado automaticamente ao Supabase.
- "Enviar para a nuvem" atualiza o backup daquele app.
- "Baixar da nuvem" substitui os dados locais pelos dados da nuvem.
- Antes do download, o app cria uma cópia de segurança local automática.
- "Restaurar cópia local anterior" desfaz o último download da nuvem.
- A sessão fica salva no aparelho; normalmente não é preciso entrar a cada abertura.
- Os dados já cadastrados na estrutura atual são enviados normalmente no primeiro upload.

IMPORTANTE
Use o mesmo e-mail/senha do usuário do aplicativo nos dois dispositivos.
Não são as credenciais administrativas da sua conta Supabase.
