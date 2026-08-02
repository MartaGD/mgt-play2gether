import('./dist/mgt-play2gether/server/server.mjs').catch((error) => {
  console.error('Failed to start SSR server from dist output.', error);
  process.exit(1);
});
