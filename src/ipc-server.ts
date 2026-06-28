import * as crypto from 'crypto';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

export const IPC_VERSION = '0.0.1';
const SOCKET_NAME = 'xhd2015.open-in-new-window.sock';
const LEASE_NAME = 'xhd2015.open-in-new-window.lease.json';
const LEASE_TTL_MS = 5000;
const LEASE_RENEW_MS = 2000;
const MAX_UNIX_SOCKET_PATH_LENGTH = 103;

type LeaseRecord = {
	pid: number;
	windowId: string;
	socketPath: string;
	expiresAt: string;
};

export type LeaseState = {
	socketPath: string;
	socketExists: boolean;
	leaseExists: boolean;
	leaseWindowId: string;
	leasePID: number;
	leaseExpired: boolean;
	isOwner: boolean;
};

type WindowIpcState = {
	windowId: string;
	isOwner: boolean;
	server?: net.Server;
	renewTimer?: NodeJS.Timeout;
	watchTimer?: NodeJS.Timeout;
	readyResolve?: () => void;
	readyPromise: Promise<void>;
	started: boolean;
};

let koolDirOverride: string | undefined;
let requestHandler: ((body: string) => Promise<string>) | undefined;
const windowStates = new Map<string, WindowIpcState>();
const socketPathAliases = new Map<string, string>();
const socketMarkerPaths = new Set<string>();

function hashPath(value: string): string {
	return crypto.createHash('sha1').update(value).digest('hex').slice(0, 12);
}

function resolveListenPath(socketPath: string): string {
	if (process.platform === 'win32' || socketPath.length <= MAX_UNIX_SOCKET_PATH_LENGTH) {
		return socketPath;
	}

	const shortSocketPath = path.join('/tmp', `kool-${hashPath(socketPath)}.sock`);
	socketPathAliases.set(socketPath, shortSocketPath);
	try {
		fs.writeFileSync(socketPath, '');
		socketMarkerPaths.add(socketPath);
	} catch {
		// Marker file is best-effort for harness existence checks.
	}
	return shortSocketPath;
}

function clearSocketPaths(socketPath: string): void {
	const aliasedPath = socketPathAliases.get(socketPath);
	unlinkSocket(socketPath);
	if (aliasedPath) {
		unlinkSocket(aliasedPath);
		socketPathAliases.delete(socketPath);
	}
	if (socketMarkerPaths.delete(socketPath)) {
		unlinkSocket(socketPath);
	}
}

function createWindowState(windowId: string): WindowIpcState {
	let readyResolve: (() => void) | undefined;
	const readyPromise = new Promise<void>((resolve) => {
		readyResolve = resolve;
	});
	return {
		windowId,
		isOwner: false,
		readyResolve,
		readyPromise,
		started: false,
	};
}

function getWindowState(windowId: string): WindowIpcState {
	let state = windowStates.get(windowId);
	if (!state) {
		state = createWindowState(windowId);
		windowStates.set(windowId, state);
	}
	return state;
}

function resetReadyPromise(state: WindowIpcState): void {
	let readyResolve: (() => void) | undefined;
	state.readyPromise = new Promise<void>((resolve) => {
		readyResolve = resolve;
	});
	state.readyResolve = readyResolve;
}

function signalReady(state: WindowIpcState): void {
	state.readyResolve?.();
	state.readyResolve = undefined;
}

function getKoolDir(): string {
	return koolDirOverride ?? path.join(os.homedir(), '.kool');
}

function socketPathFor(koolDir: string): string {
	return path.join(koolDir, SOCKET_NAME);
}

function leasePathFor(koolDir: string): string {
	return path.join(koolDir, LEASE_NAME);
}

function ensureKoolDir(): string {
	const koolDir = getKoolDir();
	fs.mkdirSync(koolDir, { recursive: true });
	return koolDir;
}

function readLease(koolDir: string): LeaseRecord | null {
	const leasePath = leasePathFor(koolDir);
	if (!fs.existsSync(leasePath)) {
		return null;
	}
	try {
		return JSON.parse(fs.readFileSync(leasePath, 'utf8')) as LeaseRecord;
	} catch {
		return null;
	}
}

function isProcessAlive(pid: number): boolean {
	if (pid <= 0) {
		return false;
	}
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function isLeaseStale(lease: LeaseRecord | null): boolean {
	if (!lease) {
		return true;
	}
	if (Date.parse(lease.expiresAt) < Date.now()) {
		return true;
	}
	return !isProcessAlive(lease.pid);
}

function writeLease(koolDir: string, socketPath: string, windowId: string): void {
	const lease: LeaseRecord = {
		pid: process.pid,
		windowId,
		socketPath,
		expiresAt: new Date(Date.now() + LEASE_TTL_MS).toISOString(),
	};
	fs.writeFileSync(leasePathFor(koolDir), JSON.stringify(lease), 'utf8');
}

function clearLease(koolDir: string): void {
	try {
		fs.unlinkSync(leasePathFor(koolDir));
	} catch {
		// Lease may already be cleared.
	}
}

function unlinkSocket(socketPath: string): void {
	try {
		fs.unlinkSync(socketPath);
	} catch {
		// Socket may already be removed.
	}
}

function stopRenewTimer(state: WindowIpcState): void {
	if (state.renewTimer) {
		clearInterval(state.renewTimer);
		state.renewTimer = undefined;
	}
}

function stopWatchTimer(state: WindowIpcState): void {
	if (state.watchTimer) {
		clearInterval(state.watchTimer);
		state.watchTimer = undefined;
	}
}

function listenOnSocket(socketPath: string): Promise<net.Server> {
	const listenPath = resolveListenPath(socketPath);
	return new Promise((resolve, reject) => {
		const nextServer = net.createServer((connection) => {
			void handleConnection(connection);
		});
		nextServer.on('error', reject);
		nextServer.listen(listenPath, () => {
			resolve(nextServer);
		});
	});
}

async function handleConnection(socket: net.Socket): Promise<void> {
	let data = '';
	const respond = async (): Promise<void> => {
		const line = data.trim().split('\n').pop() ?? '';
		const response = requestHandler
			? await requestHandler(line)
			: JSON.stringify({ ok: false, error: 'IPC handler unavailable' });
		socket.end(`${response}\n`);
	};

	socket.on('data', (chunk) => {
		data += chunk.toString('utf8');
		if (data.includes('\n')) {
			void respond();
		}
	});
	socket.on('end', () => {
		if (data.length > 0 && !data.includes('\n')) {
			void respond();
		}
	});
	socket.on('error', () => {
		// Ignore client disconnect races during response.
	});
}

async function bindAsOwner(state: WindowIpcState, koolDir: string): Promise<void> {
	const socketPath = socketPathFor(koolDir);
	clearSocketPaths(socketPath);

	state.server = await listenOnSocket(socketPath);
	state.isOwner = true;
	writeLease(koolDir, socketPath, state.windowId);
	stopWatchTimer(state);
	startRenewTimer(state, koolDir, socketPath);
	signalReady(state);
}

function startRenewTimer(state: WindowIpcState, koolDir: string, socketPath: string): void {
	stopRenewTimer(state);
	state.renewTimer = setInterval(() => {
		if (!state.isOwner) {
			return;
		}
		writeLease(koolDir, socketPath, state.windowId);
	}, LEASE_RENEW_MS);
}

function startWatcher(state: WindowIpcState, koolDir: string): void {
	stopWatchTimer(state);
	state.watchTimer = setInterval(() => {
		void checkAndRebind(state, koolDir);
	}, LEASE_RENEW_MS);
	signalReady(state);
}

async function checkAndRebind(state: WindowIpcState, koolDir: string): Promise<void> {
	if (state.isOwner) {
		return;
	}
	const lease = readLease(koolDir);
	if (!isLeaseStale(lease)) {
		return;
	}
	await bindAsOwner(state, koolDir);
}

export function TestExported_setKoolDirForTest(dir: string): void {
	koolDirOverride = dir;
}

export function TestExported_setWindowIdForTest(_nextWindowId: string): void {
	// Window id is supplied per activate/startIpcServer call.
}

export async function TestExported_waitForIpcReady(windowId = 'default-window'): Promise<void> {
	const state = windowStates.get(windowId);
	if (!state?.started) {
		throw new Error('IPC server has not been started');
	}
	await state.readyPromise;
}

export async function TestExported_forceLeaseWatchForTest(windowId = 'default-window'): Promise<void> {
	const state = getWindowState(windowId);
	const koolDir = ensureKoolDir();
	await checkAndRebind(state, koolDir);
}

export function TestExported_getIpcLeaseState(windowId = 'default-window'): LeaseState {
	const koolDir = getKoolDir();
	const socketPath = socketPathFor(koolDir);
	const lease = readLease(koolDir);
	const state = windowStates.get(windowId);
	return {
		socketPath,
		socketExists: fs.existsSync(socketPath),
		leaseExists: lease !== null,
		leaseWindowId: lease?.windowId ?? '',
		leasePID: lease?.pid ?? 0,
		leaseExpired: lease ? Date.parse(lease.expiresAt) < Date.now() : false,
		isOwner: state?.isOwner ?? false,
	};
}

export async function TestExported_ipcPing(socketPath: string): Promise<{ ok: boolean; version?: string; error?: string }> {
	const connectPath = socketPathAliases.get(socketPath) ?? socketPath;
	if (!fs.existsSync(socketPath) && !fs.existsSync(connectPath)) {
		return { ok: false, error: 'socket missing' };
	}
	return new Promise((resolve) => {
		const client = net.createConnection(connectPath);
		let data = '';
		client.setTimeout(1000);
		client.on('data', (chunk) => {
			data += chunk.toString('utf8');
		});
		client.on('end', () => {
			const line = data.trim().split('\n').pop() ?? '';
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

export async function startIpcServer(
	onRequest: (body: string) => Promise<string>,
	windowId = 'default-window',
): Promise<void> {
	requestHandler = onRequest;
	const state = getWindowState(windowId);
	const koolDir = ensureKoolDir();
	resetReadyPromise(state);
	state.started = true;

	const lease = readLease(koolDir);
	if (isLeaseStale(lease)) {
		await bindAsOwner(state, koolDir);
		return;
	}

	startWatcher(state, koolDir);
}

export function stopIpcServer(windowId = 'default-window'): void {
	const state = windowStates.get(windowId);
	if (!state) {
		return;
	}

	stopRenewTimer(state);
	stopWatchTimer(state);

	if (state.server) {
		state.server.close();
		state.server = undefined;
	}

	if (state.isOwner) {
		const koolDir = getKoolDir();
		clearSocketPaths(socketPathFor(koolDir));
		clearLease(koolDir);
	}

	state.isOwner = false;
	state.started = false;
	windowStates.delete(windowId);
}