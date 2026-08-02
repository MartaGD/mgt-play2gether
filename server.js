const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

const BOOTSTRAP_VERSION = '2026-08-02-hostinger-v4';
const SERVER_RELATIVE_PATH = ['dist', 'mgt-play2gether', 'server', 'server.mjs'];

function resolveProjectRoot() {
  const candidates = [
    process.cwd(),
    join(process.cwd(), '..', 'repository'),
    join(process.cwd(), '..', 'source', 'repository'),
    join(process.cwd(), '..', '..', 'repository'),
    join(process.cwd(), '..', '..', 'source', 'repository'),
    join(process.cwd(), '..', '..', '..', 'source', 'repository'),
    join(process.cwd(), '..', '..', '..', '..', 'source', 'repository'),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'package.json')) && existsSync(join(candidate, 'angular.json'))) {
      return candidate;
    }
  }

  return null;
}

function resolveServerEntry() {
  const candidates = [
    join(process.cwd(), ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', 'repository', ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', 'source', 'repository', ...SERVER_RELATIVE_PATH),
    join(process.cwd(), '..', '..', 'repository', ...SERVER_RELATIVE_PATH),
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
  console.log(`[bootstrap] version = ${BOOTSTRAP_VERSION}`);

  const resolved = resolveServerEntry();
  let entry = typeof resolved === 'string' ? resolved : resolved.entry;
  const checkedCandidates = typeof resolved === 'string' ? [] : resolved.candidates;
  const projectRoot = resolveProjectRoot();

  if (!entry) {
    console.log(`[bootstrap] process.cwd() = ${process.cwd()}`);
    console.log(`[bootstrap] projectRoot = ${projectRoot ?? 'not found'}`);
    console.log('[bootstrap] Checked paths:');
    for (const path of checkedCandidates) {
      console.log(`[bootstrap] - ${path}`);
    }

    if (!projectRoot) {
      console.error(
        '[bootstrap] Angular project root not found. Ensure Hostinger Root Folder points to the repository containing angular.json, not only the nodejs runtime folder.',
      );
      process.exit(1);
    }

    console.log('[bootstrap] Build output not found. Running npm run build...');
    const result = spawnSync('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
      cwd: projectRoot,
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

process.env.FORCE_LISTEN = '1';
import(pathToFileURL(serverEntry).href).catch((error) => {
  console.error('Failed to start SSR server from dist output.', error);
  process.exit(1);
});
