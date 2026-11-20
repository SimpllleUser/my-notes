# my-notes

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Type-Check, Compile and Minify for Production

```sh
yarn build
```

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```

## MCP-сервер для Claude

Worker віддає MCP (Streamable HTTP) на `/mcp`, решта шляхів — SPA. Код: `worker/`.

Tools: `list_folders`, `list_notes`, `search_notes`, `read_note`, `create_note`, `append_to_note`, `update_note`.

Налаштування:

```sh
# Appwrite → API keys: scopes databases.read + databases.write (лише на потрібні таблиці)
wrangler secret put APPWRITE_API_KEY
wrangler secret put MCP_TOKEN        # довга випадкова строка, напр. `openssl rand -hex 32`
yarn deploy
```

Локально: скопіювати `.dev.vars.example` у `.dev.vars` і запустити `yarn preview`.

Підключення в Claude Code:

```sh
claude mcp add --transport http notes https://my-notes.<subdomain>.workers.dev/mcp \
  --header "Authorization: Bearer <MCP_TOKEN>"
```

Якщо таблиці Appwrite перевіряють права на рівні рядка, додайте змінну `OWNER_USER_ID`, щоб створені рядки були видимі у застосунку.
