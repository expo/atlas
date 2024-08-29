import type { AtlasBundle, AtlasBundleHmr } from 'expo-atlas';

/**
 * The HMR messages received from the server
 * @see https://github.com/facebook/metro/blob/f228acc33c4916dbae773fdd377848da82e3c130/packages/metro-runtime/src/modules/types.flow.js#L91
 */
export type HmrServerMessage =
  | { type: 'bundle-registered' }
  | { type: 'update-start'; body: Pick<HmrServerUpdate, 'isInitialUpdate'> }
  | { type: 'update'; body: HmrServerUpdate }
  | { type: 'update-done' }
  | { type: 'error'; body: HmrServerError };

export type HmrServerUpdate = {
  added: HmrModule[];
  deleted: AtlasBundle['id'][];
  modified: HmrModule[];
  revisionId: string;
  isInitialUpdate: boolean;
};

type HmrModule = {
  module: [AtlasBundle['id'], string];
  sourceMappingURL: string;
  sourceURL: string;
};

type HmrServerError = {
  type: string;
  message: string;
  errors: any[];
};

/**
 * The HMR messages sent to the server
 * @see https://github.com/facebook/metro/blob/f228acc33c4916dbae773fdd377848da82e3c130/packages/metro-runtime/src/modules/types.flow.js#L68
 */
export type HmrClientMessage =
  | { type: 'register-entrypoints'; entryPoints: string[] }
  | { type: 'log'; level: HmrClientLogLevel; data: any[]; mode: 'BRIDGE' | 'NOBRIDGE' }
  | { type: 'log-opt-in' };

type HmrClientLogLevel =
  | 'trace'
  | 'info'
  | 'warn'
  | 'log'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd'
  | 'debug';

export class AtlasHmrClient {
  /** The WebSocket connection to the Metro HMR server */
  private socket: null | WebSocket = null;
  /** The Atlas bundle HMR information, if connected */
  private bundleHmr: null | AtlasBundleHmr = null;
  /** The callback invoked when an HMR update was received */
  private updateCallback: null | ((update: HmrServerUpdate) => any) = null;

  private onMessage(message: HmrServerMessage) {
    // Ignore any non-update messages, initial update message, or updates without changes
    if (message.type !== 'update' || message.body.isInitialUpdate || !updateHasChanges(message)) {
      return;
    }

    // Invoke the update callback with the update body
    this.updateCallback?.(message.body);
  }

  get isConnected() {
    return this.socket && this.socket.readyState === this.socket.OPEN;
  }

  get bundleId() {
    return this.bundleHmr?.bundleId;
  }

  send(message: HmrClientMessage) {
    if (this.isConnected) {
      this.socket?.send(JSON.stringify(message));
    }
  }

  enable(bundleHmr: AtlasBundleHmr, updateCallback: (update: HmrServerUpdate) => any) {
    if (this.isConnected && this.bundleHmr?.bundleId === bundleHmr.bundleId) {
      // Avoid re-enabling the same bundle HMR connection
      return this;
    } else if (this.socket) {
      // Clean up the old HMR connection before enabling the new bundle HMR connection
      this.disable();
    }

    // Store the bundle HMR info and start the HMR connection
    this.updateCallback = updateCallback;
    this.bundleHmr = bundleHmr;
    this.socket = new WebSocket(bundleHmr.socketUrl);

    // Listen to any incoming messages from the HMR server
    this.socket.addEventListener('message', (message) => {
      if ('data' in message && typeof message.data === 'string') {
        this.onMessage(JSON.parse(message.data));
      }
    });

    // Automatically register for the bundle enetry points when the connection is open
    this.socket.addEventListener('open', () => {
      this.send({ type: 'register-entrypoints', entryPoints: bundleHmr.entryPoints });
    });

    return this;
  }

  disable() {
    this.socket?.close(1000, 'Normal Closure');
    this.socket = null;
    this.bundleHmr = null;
    this.updateCallback = null;

    return this;
  }
}

/** Determine if the HMR update message contains any changes */
function updateHasChanges(update: Extract<HmrServerMessage, { type: 'update' }>) {
  return (
    update.body.added.length > 0 ||
    update.body.modified.length > 0 ||
    update.body.deleted.length > 0
  );
}
