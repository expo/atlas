// Polyfill `Symbol.dispose` for explicit resource management
if (typeof Symbol.dispose === 'undefined') {
  Object.defineProperty(Symbol, 'dispose', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Symbol.for('polyfill:dispose'),
  });
}

// Polyfill `Symbol.dispose` for explicit resource management
if (typeof Symbol.asyncDispose === 'undefined') {
  Object.defineProperty(Symbol, 'asyncDispose', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: Symbol.for('polyfill:asyncDispose'),
  });
}
