
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
    "route": "/kingdom"
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
    'index.csr.html': {size: 1445, hash: '90294fd8b41ba3833eb6f59ce8d538942c597c786c86f012caaeb1c6bcfda066', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1011, hash: 'b6b409c425f09b53f2f3a0287f68b26056494489046d1efd4e9bde433accc1a2', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-CAEAGL2V.css': {size: 133262, hash: 'gne5NF85Ml0', text: () => import('./assets-chunks/styles-CAEAGL2V_css.mjs').then(m => m.default)}
  },
};
