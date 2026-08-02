
export default {
  basePath: '/',
  allowedHosts: [
  "mtg-play2gether.com",
  "www.mtg-play2gether.com",
  "localhost",
  "127.0.0.1"
],
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
