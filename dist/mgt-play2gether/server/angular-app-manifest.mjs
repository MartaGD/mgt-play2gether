
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 0,
    "route": "/"
  },
  {
    "renderMode": 0,
    "route": "/home"
  },
  {
    "renderMode": 0,
    "route": "/treachery"
  },
  {
    "renderMode": 0,
    "redirectTo": "/home",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 1445, hash: 'e88330720d079c37bb9517d7f964bede508ee0b6c176cfdaea94dcc08a241557', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1011, hash: 'a351c820c3a77f0579704472f7d014b0fe213da38336abc1d228ec26e8914292', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-H27WDWI4.css': {size: 86908, hash: '8qvmGEifNBU', text: () => import('./assets-chunks/styles-H27WDWI4_css.mjs').then(m => m.default)}
  },
};
