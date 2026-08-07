// Configure o Supabase para ativar login individual e sincronização entre aparelhos.
// Sem essas chaves, o site funciona em MODO PESSOAL e salva tudo apenas neste navegador.
window.APP_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  REQUIRE_LOGIN: false,
  ALLOW_SIGNUP: false
};
