
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
    'index.csr.html': {size: 1598, hash: 'b12264bb9c7b856787dda5ca33fcb6ad51840ed0d68bc2967b1f041cff958ee0', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1164, hash: '9542af96cec13ba3b4799b7660abf61a2d1aadff53e10703233771e170f09241', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-CAEAGL2V.css': {size: 133262, hash: 'gne5NF85Ml0', text: () => import('./assets-chunks/styles-CAEAGL2V_css.mjs').then(m => m.default)}
  },
};
