# Publicação · Prime Depot

## 1. Ambiente de teste (apresentação ao proprietário)

### Envie para o servidor (pasta do teste)

```
.htaccess            .well-known/security.txt
index.html           checkout.html       order-success.html     404.html
styles.css           checkout.css        main.js  checkout.js   success.js
robots.txt           llms.txt            sitemap.xml            humans.txt
site.webmanifest     favicon.ico         assets/  (pasta inteira)
```

**Não envie:** `_deploy/`, `.impeccable/`, `Briefing Prime Depot.txt`, `OTIMIZAÇÃO HOME….md`, `PRODUCT.md`, `DESIGN.md`.
(O `.htaccess` também bloqueia esses arquivos, caso subam por engano.)

### Ajustes obrigatórios no servidor

1. **Subpasta:** se o teste ficar em uma subpasta (ex.: `dominio.com/teste/`):
   - `.htaccess`: `ErrorDocument 404 /teste/404.html`
   - `404.html`: `<base href="/teste/">`
2. **Sem SSL no teste?** Comente as 3 linhas "Força HTTPS" no `.htaccess`.

### Acesso

Livre para quem tem o link (sem senha). O teste continua fora do Google pelo `robots.txt` e pelo cabeçalho `X-Robots-Tag` do `.htaccess`.

## 2. Produção (primedepotglobal.com)

1. Substitua `.htaccess` por `_deploy/producao/.htaccess` (liberado para o Google, com HSTS e cache longo).
2. Substitua `robots.txt` por `_deploy/producao/robots.txt`.
3. Formulários: preencha `data-endpoint` no formulário de orçamento (`index.html`) e no checkout (`checkout.html`) com a URL do serviço de envio (ex.: Formspree, Make, e-mail do servidor). Vazio = abre o e-mail do visitante com o pedido pronto.
4. Envie `sitemap.xml` no Google Search Console.
5. Teste o compartilhamento em https://www.opengraph.xyz/ (a imagem é `assets/img/og-image.jpg`).

## 3. Arquivos de apoio

| Arquivo | Para quê |
|---|---|
| `.htaccess` | Bloqueio do Google, HTTPS, segurança, compressão e cache |
| `robots.txt` | Teste: bloqueia robôs. Produção: libera e aponta o sitemap |
| `llms.txt` | Resumo da empresa, produtos e preços para assistentes de IA |
| `sitemap.xml` | Lista de páginas para o Google |
| `humans.txt` | Créditos (Eu Sou TS) |
| `.well-known/security.txt` | Contato para avisos de segurança (renovar até 24/09/2027) |
| `site.webmanifest` + `assets/icons/` | Ícones do navegador, iPhone e Android |
| `favicon.ico` | Ícone da aba |
| `assets/img/og-image.jpg` | Imagem ao compartilhar o link (WhatsApp, Facebook, LinkedIn) |
| `404.html` | Página de "não encontrada" com a cara do site |
