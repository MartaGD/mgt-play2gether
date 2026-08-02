
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
    'index.csr.html': {size: 1445, hash: '707539f4c1b381ab3da17f36e42d0fcc4e139e4d293a82bfb011d19255ceb926', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1011, hash: '7334d7f88b4ccbf9f7ff855df9117b7584b31c616dd53673a6d8622649c691e0', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-CAEAGL2V.css': {size: 133262, hash: 'gne5NF85Ml0', text: () => import('./assets-chunks/styles-CAEAGL2V_css.mjs').then(m => m.default)}
  },
};
