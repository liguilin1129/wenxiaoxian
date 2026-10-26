// Keeps relocated test suites independent from the miniapp source directory.
const Module = require('node:module');
const path = require('node:path');
const resolveFilename = Module._resolveFilename;
const miniappRoot = path.resolve(__dirname, '..', '..', 'miniapp', 'miniprogram');

Module._resolveFilename = function resolveMiniappRequest(request, parent, isMain, options) {
  if (request.startsWith('../miniprogram')) {
    const suffix = request.slice('../miniprogram'.length).replace(/^[/\\]/, '');
    return resolveFilename.call(this, path.join(miniappRoot, suffix), parent, isMain, options);
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};
