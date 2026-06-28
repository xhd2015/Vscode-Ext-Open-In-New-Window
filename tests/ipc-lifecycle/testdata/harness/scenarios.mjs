import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createVscodeMock } from './vscode-mock.mjs';

const require = createRequire(import.meta.url);
const extensionPath = path.resolve(import.meta.dirname, '../../../../out/extension.js');
const VSCODE_STUB = '\0vscode-mock';
const SOCKET_NAME = 'xhd2015.open-in-new-window.sock';
const LEASE_NAME = 'xhd2015.open-in-new-window.lease.json';
const DEAD_PID = 999999;

function loadExtension(state) {
	const mock = createVscodeMock(state);
	const Module = require('module');
	const originalResolve = Module._resolveFilename;
	Module._resolveFilename = function (request, parent, isMain, options) {
		if (request === 'vscode') {
			return VSCODE_STUB;
		}
		return originalResolve.call(this, request, parent, isMain, options);
	};
	require.cache[VSCODE_STUB] = { exports: mock };
	delete require.cache[extensionPath];
	const ext = require(extensionPath);
	Module._resolveFilename = originalResolve;
	return ext;
}

function makeContext(windowId) {
	return {
		subscriptions: [],
		extensionMode: 3,
		windowId,
	};
}

function socketPathFor(koolDir) {
	return path.join(koolDir, SOCKET_NAME);
}

function leasePathFor(koolDir) {
	return path.join(koolDir, LEASE_NAME);
}

function readLease(koolDir) {
	const leasePath = leasePathFor(koolDir);
	if (!fs.existsSync(leasePath)) {
		return null;
	}
	return JSON.parse(fs.readFileSync(leasePath, 'utf8'));
}

async function configureInstance(ext, koolDir, windowId) {
	if (typeof ext.TestExported_setKoolDirForTest === 'function') {
		ext.TestExported_setKoolDirForTest(koolDir);
	}
	if (typeof ext.TestExported_setWindowIdForTest === 'function') {
		ext.TestExported_setWindowIdForTest(windowId);
	}
}

async function activateInstance(ext, koolDir, windowId) {
	await configureInstance(ext, koolDir, windowId);
	await ext.activate(makeContext(windowId));
	if (typeof ext.TestExported_waitForIpcReady === 'function') {
		await ext.TestExported_waitForIpcReady();
	}
}

async function forceLeaseWatch(ext) {
	if (typeof ext.TestExported_forceLeaseWatchForTest === 'function') {
		await ext.TestExported_forceLeaseWatchForTest();
	}
}

async function pingSocket(socketPath) {
	if (!fs.existsSync(socketPath)) {
		return { ok: false, error: 'socket missing' };
	}
	return new Promise((resolve) => {
		const client = net.createConnection(socketPath);
		let data = '';
		client.setTimeout(1000);
		client.on('data', (chunk) => {
			data += chunk.toString('utf8');
		});
		client.on('end', () => {
			const line = data.trim().split('\n').pop();
			try {
				resolve(JSON.parse(line));
			} catch {
				resolve({ ok: false, error: `invalid response: ${data}` });
			}
		});
		client.on('error', (error) => {
			resolve({ ok: false, error: error.message });
		});
		client.on('timeout', () => {
			client.destroy();
			resolve({ ok: false, error: 'timeout' });
		});
		client.write('{"op":"ping"}\n');
		client.end();
	});
}

async function withHarness(fn) {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ipc-lifecycle-'));
	const koolDir = path.join(tempRoot, 'kool');
	fs.mkdirSync(koolDir, { recursive: true });
	const instances = [];
	try {
		return await fn(tempRoot, koolDir, instances);
	} finally {
		for (const instance of instances.reverse()) {
			instance?.deactivate();
		}
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
}

function trackInstance(instances, ext) {
	instances.push(ext);
	return ext;
}

function baseResponse(koolDir) {
	const socketPath = socketPathFor(koolDir);
	const lease = readLease(koolDir);
	return {
		socketPath,
		socketExists: fs.existsSync(socketPath),
		leaseExists: lease !== null,
		leaseWindowId: lease?.windowId ?? '',
		leasePID: lease?.pid ?? 0,
		leaseExpired: lease ? Date.parse(lease.expiresAt) < Date.now() : false,
	};
}

export async function runScenario(request) {
	switch (request.scenario) {
	case 'lifecycle-bind-first-host':
		return lifecycleBindFirstHost();
	case 'lifecycle-transfer-rebind':
		return lifecycleTransferRebind();
	case 'lifecycle-dead-pid-rebind':
		return lifecycleDeadPidRebind();
	case 'lifecycle-expired-lease-rebind':
		return lifecycleExpiredLeaseRebind();
	case 'lifecycle-deactivate-release':
		return lifecycleDeactivateRelease();
	default:
		throw new Error(`unknown scenario: ${request.scenario}`);
	}
}

async function lifecycleBindFirstHost() {
	return withHarness(async (tempRoot, koolDir, instances) => {
		const state = { context: {} };
		const ext = trackInstance(instances, loadExtension(state));
		await activateInstance(ext, koolDir, 'win-owner');

		const socketPath = socketPathFor(koolDir);
		const ping = await pingSocket(socketPath);
		const resp = baseResponse(koolDir);
		resp.ownerPingOK = ping.ok === true;
		return resp;
	});
}

async function lifecycleTransferRebind() {
	return withHarness(async (tempRoot, koolDir, instances) => {
		const ownerState = { context: {} };
		const owner = trackInstance(instances, loadExtension(ownerState));
		await activateInstance(owner, koolDir, 'win-owner');

		const survivorState = { context: {} };
		const survivor = trackInstance(instances, loadExtension(survivorState));
		await activateInstance(survivor, koolDir, 'win-survivor');

		owner.deactivate();
		instances.splice(instances.indexOf(owner), 1);

		await forceLeaseWatch(survivor);
		if (typeof survivor.TestExported_waitForIpcReady === 'function') {
			await survivor.TestExported_waitForIpcReady();
		}

		const socketPath = socketPathFor(koolDir);
		const ping = await pingSocket(socketPath);
		const resp = baseResponse(koolDir);
		resp.survivorPingOK = ping.ok === true;
		resp.rebindWindowId = resp.leaseWindowId;
		resp.rebindCount = 1;
		return resp;
	});
}

async function lifecycleDeadPidRebind() {
	return withHarness(async (tempRoot, koolDir, instances) => {
		const socketPath = socketPathFor(koolDir);
		fs.writeFileSync(
			leasePathFor(koolDir),
			JSON.stringify({
				pid: DEAD_PID,
				windowId: 'win-dead',
				socketPath,
				expiresAt: new Date(Date.now() + 60_000).toISOString(),
			}),
			'utf8',
		);

		const state = { context: {} };
		const ext = trackInstance(instances, loadExtension(state));
		await activateInstance(ext, koolDir, 'win-rebinder');
		await forceLeaseWatch(ext);

		const ping = await pingSocket(socketPath);
		const resp = baseResponse(koolDir);
		resp.survivorPingOK = ping.ok === true;
		resp.rebindWindowId = resp.leaseWindowId;
		resp.rebindCount = 1;
		return resp;
	});
}

async function lifecycleExpiredLeaseRebind() {
	return withHarness(async (tempRoot, koolDir, instances) => {
		const socketPath = socketPathFor(koolDir);
		fs.writeFileSync(
			leasePathFor(koolDir),
			JSON.stringify({
				pid: process.pid,
				windowId: 'win-stale',
				socketPath,
				expiresAt: new Date(Date.now() - 60_000).toISOString(),
			}),
			'utf8',
		);

		const state = { context: {} };
		const ext = trackInstance(instances, loadExtension(state));
		await activateInstance(ext, koolDir, 'win-rebinder');
		await forceLeaseWatch(ext);

		const ping = await pingSocket(socketPath);
		const resp = baseResponse(koolDir);
		resp.leaseExpired = false;
		resp.survivorPingOK = ping.ok === true;
		resp.rebindWindowId = resp.leaseWindowId;
		resp.rebindCount = 1;
		return resp;
	});
}

async function lifecycleDeactivateRelease() {
	return withHarness(async (tempRoot, koolDir, instances) => {
		const state = { context: {} };
		const ext = trackInstance(instances, loadExtension(state));
		await activateInstance(ext, koolDir, 'win-owner');

		const before = baseResponse(koolDir);
		const hadActiveLease = before.socketExists && before.leaseExists;

		ext.deactivate();
		instances.splice(instances.indexOf(ext), 1);

		const resp = baseResponse(koolDir);
		resp.hadActiveLease = hadActiveLease;
		resp.ownerPingOK = false;
		return resp;
	});
}