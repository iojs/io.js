'use strict';

// This test verifies that an appropriate error is thrown when the current
// working directory is deleted and process.cwd() is called.
//
// We do this by spawning a forked process and deleting the tmp cwd
// while it is starting up.

const common = require('../common');
const { fork } = require('node:child_process');
const { rmSync } = require('node:fs');
const assert = require('node:assert'); // Import assert properly
const { Buffer } = require('node:buffer');

if (process.argv[2] === 'child') {
  try {
    while (true) {
      process.cwd(); // Continuously call process.cwd()
    }
  } catch (err) {
    console.error(err);
    process.exit(1); // Ensure the process exits with failure
  }
}

const tmpdir = require('../common/tmpdir');
tmpdir.refresh();
const tmpDir = tmpdir.path;

const proc = fork(__filename, ['child'], {
  cwd: tmpDir,
  silent: true,
});

proc.on('spawn', common.mustCall(() => rmSync(tmpDir, { recursive: true })));

proc.on('exit', common.mustCall((code) => {
  assert.strictEqual(code, 1);
  proc.stderr.toArray().then(common.mustCall((chunks) => {
    const buf = Buffer.concat(chunks);
    assert.match(buf.toString(), /Current working directory does not exist/);
  }));
}));
