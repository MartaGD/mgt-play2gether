
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
    "route": "/life-counter"
  },
  {
    "renderMode": 0,
    "route": "/life-counter/counter"
  },
  {
    "renderMode": 0,
    "redirectTo": "/home",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 1445, hash: '556e35db70d63562bb00708c9b9aed2a9166d0d68e6aa201755053d7d24b3cc8', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1011, hash: '5b94e6935509326cbad6628091351e6679f434899bbb134dad9e1cee7c39e119', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-CAEAGL2V.css': {size: 133262, hash: 'gne5NF85Ml0', text: () => import('./assets-chunks/styles-CAEAGL2V_css.mjs').then(m => m.default)}
  },
};
