const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync, spawn } = require('node:child_process');

const SERVER_RELATIVE_PATH = ['dist', 'mgt-play2gether', 'server', 'server.mjs'];

function resolveServerEntry() {
  const candidates = [
    join(process.cwd(), ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', 'source', 'repository', ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', '..', 'source', 'repository', ...SERVER_RELATIVE_PATH),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function runBuildIfNeeded() {
  let entry = resolveServerEntry();

  if (!entry) {
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

    entry = resolveServerEntry();
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

const child = spawn(process.execPath, [serverEntry], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env,
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
