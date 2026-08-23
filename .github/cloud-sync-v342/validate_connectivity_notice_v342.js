'use strict';

const assert = require('assert');
const path = require('path');

const loaderPath = path.resolve('cloud/activation-loader-v342.js');
delete require.cache[loaderPath];
require(loaderPath);

const api = global.FEQUEST_CLOUD_ACTIVATION_V342;
assert(api && typeof api.installConnectivityNoticeRecovery === 'function', 'connectivity recovery API must exist');

const listeners = new Map();
global.addEventListener = (type, fn) => {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type).push(fn);
};

let notice = { className: 'app-notice show offline' };
notice.classList = { contains: token => notice.className.split(/\s+/).includes(token) };
global.document = { getElementById: id => id === 'appNotice' ? notice : null };
Object.defineProperty(global, 'navigator', { configurable: true, value: { onLine: false } });

delete global.FEQUEST_V342_CONNECTIVITY_NOTICE_RECOVERY_INSTALLED;
assert.strictEqual(api.installConnectivityNoticeRecovery(), true, 'handler installation should succeed');
assert.strictEqual(notice.className, 'app-notice show offline', 'offline notice must remain while offline');
assert.strictEqual((listeners.get('online') || []).length, 1, 'one online handler must be installed');
assert.strictEqual((listeners.get('pageshow') || []).length, 1, 'one pageshow handler must be installed');

global.navigator.onLine = true;
listeners.get('online')[0]();
assert.strictEqual(notice.className, 'app-notice', 'stale offline notice must clear after reconnect');

notice.className = 'app-notice show update';
listeners.get('pageshow')[0]();
assert.strictEqual(notice.className, 'app-notice show update', 'non-offline notices must not be dismissed');

assert.strictEqual(api.installConnectivityNoticeRecovery(), true, 'reinstall should be idempotent');
assert.strictEqual((listeners.get('online') || []).length, 1, 'idempotent install must not duplicate online listeners');
assert.strictEqual((listeners.get('pageshow') || []).length, 1, 'idempotent install must not duplicate pageshow listeners');

console.log('PASS — V342 CONNECTIVITY NOTICE RECOVERY');
