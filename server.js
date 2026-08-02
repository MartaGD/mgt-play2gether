const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync, spawn } = require('node:child_process');

const SERVER_RELATIVE_PATH = ['dist', 'mgt-play2gether', 'server', 'server.mjs'];

function resolveServerEntry() {
  const candidates = [
    join(process.cwd(), ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', 'source', 'repository', ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', '..', 'source', 'repository', ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', '..', '..', 'source', 'repository', ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', '..', '..', '..', 'source', 'repository', ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', '..', '..', '..', '..', 'source', 'repository', ...SERVER_RELATIVE_PATH),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return { entry: null, candidates };
}

function runBuildIfNeeded() {
  const resolved = resolveServerEntry();
  let entry = typeof resolved === 'string' ? resolved : resolved.entry;
  const checkedCandidates = typeof resolved === 'string' ? [] : resolved.candidates;

  if (!entry) {
    console.log(`[bootstrap] process.cwd() = ${process.cwd()}`);
    console.log('[bootstrap] Checked paths:');
    for (const path of checkedCandidates) {
      console.log(`[bootstrap] - ${path}`);
    }
    console.log('[bootstrap] Build output not found. Running npm run build...');
    const result = spawnSync('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env: process.env,
    });

    if (result.status !== 0) {
      console.error('[bootstrap] Build failed. Server cannot start.');
      process.exit(result.status ?? 1);
    }

    const retryResolved = resolveServerEntry();
    entry = typeof retryResolved === 'string' ? retryResolved : retryResolved.entry;
  }

  if (!entry) {
    console.error(
      '[bootstrap] Build completed but SSR entry is still missing. Checked current and Hostinger build paths.',
    );
    process.exit(1);
  }

  console.log(`[bootstrap] Found build output at ${entry}.`);
  return entry;
}

const serverEntry = runBuildIfNeeded();

const defaultAllowedHosts = [
  'mgt-play2gether.com',
  'www.mgt-play2gether.com',
  'localhost',
  '127.0.0.1',
];

const defaultTrustedProxyHeaders = [
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-forwarded-port',
  'x-forwarded-for',
];

const childEnv = {
  ...process.env,
  NG_ALLOWED_HOSTS:
    process.env.NG_ALLOWED_HOSTS || defaultAllowedHosts.join(','),
  NG_TRUST_PROXY_HEADERS:
    process.env.NG_TRUST_PROXY_HEADERS || defaultTrustedProxyHeaders.join(','),
};

const child = spawn(process.execPath, [serverEntry], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: childEnv,
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Failed to start SSR server from dist output.', error);
  process.exit(1);
});
