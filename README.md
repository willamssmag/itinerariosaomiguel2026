# 40 Dias com São Miguel – 2026 | Versão V3 transcrita

Esta versão não depende mais dos PDFs nem da pasta de imagens de páginas para exibir o conteúdo.

## Correção principal
As 424 páginas do exemplar fornecido foram convertidas em texto digital e armazenadas em `transcription.js`. O leitor do site monta cada página diretamente em HTML, portanto não deve mais aparecer página vazia por arquivo JPG/PDF ausente na Vercel.

## Arquivos importantes
- `index.html` – estrutura do site.
- `styles.css` – visual responsivo.
- `app.js` – navegação, leitor e diário.
- `days.js` – mapa dos 40 dias.
- `transcription.js` – transcrição das 424 páginas.
- `config.js` – configuração opcional do Supabase.
- `supabase-schema.sql` – estrutura do banco para login/diário.
- `assets/` – capa e ícones.

## Publicar na Vercel
Envie todo o conteúdo desta pasta para o repositório e faça um novo deploy. Não é necessário enviar a pasta `pages/` nem os PDFs antigos.

## Cache
O service worker foi alterado para `sao-miguel-v3-text`; isso força a nova versão a substituir o cache anterior.

## Observação sobre a transcrição
O PDF original é composto por páginas digitalizadas, sem camada de texto. A transcrição foi feita por reconhecimento de texto e pode conter pequenas diferenças de acentuação, pontuação ou palavras em relação à impressão. O conteúdo pode ser revisado página a página posteriormente.
