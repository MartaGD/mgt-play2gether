const { existsSync } = require('node:fs');
const { createServer, request: httpRequest } = require('node:http');
const { dirname, join } = require('node:path');
const { spawnSync, spawn } = require('node:child_process');

const BOOTSTRAP_VERSION = '2026-08-02-hostinger-v9';
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

function resolveChildCwd(entryPath) {
  const browserFolderCandidate = join(dirname(entryPath), '..', 'browser');
  if (existsSync(browserFolderCandidate)) {
    return browserFolderCandidate;
  }

  return process.cwd();
}

const publicPort = Number(process.env.PORT || 4000);
const internalPort = Number(process.env.INTERNAL_SSR_PORT || publicPort + 1);

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
  PORT: String(internalPort),
  NG_ALLOWED_HOSTS: process.env.NG_ALLOWED_HOSTS || defaultAllowedHosts.join(','),
  NG_TRUST_PROXY_HEADERS:
    process.env.NG_TRUST_PROXY_HEADERS || defaultTrustedProxyHeaders.join(','),
};

let childReady = false;

let requestHandler = (_req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.end(
    '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="1"><title>Starting</title></head><body>Starting app, retrying...</body></html>',
  );
};

const server = createServer((req, res) => {
  try {
    requestHandler(req, res);
  } catch (error) {
    console.error('[bootstrap] Request handling failed.', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    res.end('Internal server error.');
  }
});

server.listen(publicPort, () => {
  console.log(`[bootstrap] Main process listening on port ${publicPort}.`);
});

const child = spawn(process.execPath, [serverEntry], {
  stdio: 'inherit',
  cwd: resolveChildCwd(serverEntry),
  env: childEnv,
});

child.on('spawn', () => {
  console.log(`[bootstrap] SSR child spawned on internal port ${internalPort}.`);
});

child.on('error', (error) => {
  console.error('[bootstrap] Failed to spawn SSR child process.', error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  childReady = false;
  console.error(`[bootstrap] SSR child exited (code=${code ?? 'null'}, signal=${signal ?? 'null'}).`);
  process.exit(code ?? 1);
});

requestHandler = (req, res) => {
  if (!childReady) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.end(
      '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="1"><title>Starting</title></head><body>Starting app, retrying...</body></html>',
    );
    return;
  }

  const proxyReq = httpRequest(
    {
      host: '127.0.0.1',
      port: internalPort,
      method: req.method,
      path: req.url,
      headers: req.headers,
    },
    (proxyRes) => {
      childReady = true;
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error) => {
    console.error('[bootstrap] Proxy request failed.', error);
    if (!res.headersSent) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    res.end(
      '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="1"><title>Starting</title></head><body>Starting app, retrying...</body></html>',
    );
  });

  req.pipe(proxyReq);
};

function probeChildReadiness() {
  if (childReady) {
    return;
  }

  const probeReq = httpRequest(
    {
      host: '127.0.0.1',
      port: internalPort,
      method: 'GET',
      path: '/api/rooms/AAAAAA',
      timeout: 500,
    },
    (probeRes) => {
      probeRes.resume();
      childReady = true;
      console.log('[bootstrap] SSR child is ready to serve requests.');
    },
  );

  probeReq.on('timeout', () => {
    probeReq.destroy();
  });

  probeReq.on('error', () => {
    // Child still warming up.
  });

  probeReq.end();
}

const probeInterval = setInterval(probeChildReadiness, 250);
probeInterval.unref();
probeChildReadiness();

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
