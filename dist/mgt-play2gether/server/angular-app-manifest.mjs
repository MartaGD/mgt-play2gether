
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
    'index.csr.html': {size: 1598, hash: 'd5140e8c3ef2e2c615dcf4ac2f951918e151b5ecadea1ae06bedd4261a84d98b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1164, hash: '32740ae4e631aa44e0362fbb07ef5cfcca7ef1674f01a5166ef43ddf91ddcb23', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-CAEAGL2V.css': {size: 133262, hash: 'gne5NF85Ml0', text: () => import('./assets-chunks/styles-CAEAGL2V_css.mjs').then(m => m.default)}
  },
};
