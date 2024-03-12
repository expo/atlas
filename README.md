# Expo Atlas

Inspect the bundle stats from Metro.

> [!Warning]
> This project is highly experimental and will likely not work for your project.

## 🚀 How to use it

Install the `expo-atlas` package as (development) dependency to your project:

```bash
$ npx expo install expo-atlas
```

Configure your Metro config to emit a `.expo/stats.json` file containing information about your bundles.

```js metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withMetroBundleConfig } = require('expo-atlas/metro');

const config = getDefaultConfig(__dirname);

// Add the `withMetroBundleConfig` from `expo-atlas/metro` as last change
module.exports = withMetroBundleConfig(config);
```

After that, you can generate a new bundle and inspect these through the CLI

```bash
# Export bundles for all platforms,
# or use `--platform android --platform ios` to enable specific exports
$ npx expo export --platform all

# Start inspecting
$ npx expo-atlas
```

## 🧑‍🤝‍🧑 Sharing stats files

You can also open a previously created `stats.json` file:

```
$ npx expo-atlas ./path/to/stats.json
```

<div align="center">
  <br />
  with&nbsp;❤️&nbsp;&nbsp;<strong>byCedric</strong>
  <br />
</div>
