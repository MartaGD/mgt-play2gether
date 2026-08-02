
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 0,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 692, hash: 'eed5043f1eab0a4412b53d520305dd4278f1024d0697676c0dd105d088e466ec', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1011, hash: '84bc6011ded2811fc352090039a00ce6d70293ed28c81e6fd2417e06f0b9f557', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-3J7BQTOV.css': {size: 69, hash: '9UuqSnXuYwM', text: () => import('./assets-chunks/styles-3J7BQTOV_css.mjs').then(m => m.default)}
  },
};
