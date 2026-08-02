
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
    'index.csr.html': {size: 1445, hash: '1343d8c1ce5fcce58ecb2b3a6d97f86f864162d967971fb892a9368d2a344126', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1011, hash: '961949acc242ab03c9d545615e25ab7ed9c40366b8ec639aaf1732013038c783', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-H27WDWI4.css': {size: 86908, hash: '8qvmGEifNBU', text: () => import('./assets-chunks/styles-H27WDWI4_css.mjs').then(m => m.default)}
  },
};
