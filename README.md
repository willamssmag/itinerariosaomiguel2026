# 40 Dias com São Miguel – 2026 (Versão Digital V2)

## O que mudou nesta versão
- Corrigido o problema das páginas vazias / 404.
- Leitura agora é feita por imagens das páginas do livro, e não por iframe PDF.
- Visual totalmente redesenhado, com aparência mais refinada para celular.
- Melhor experiência de leitura e navegação entre os 40 dias.

## Estrutura principal
- `pages/` → páginas do livro em JPG.
- `assets/` → capa e ícones.
- `days.js` → mapeamento dos 40 dias.
- `app.js` → lógica do site.
- `config.js` → configuração opcional do Supabase.

## Publicar na Vercel
1. Envie **todos os arquivos e pastas**, incluindo `pages/`.
2. Faça o deploy como projeto estático.
3. Se quiser login real, edite `config.js` e configure o Supabase.

## Observação
Esta versão foi preparada para uso privado do exemplar digital fornecido pelo proprietário.
