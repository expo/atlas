# Expo Atlas

Inspect the bundle stats from Metro.

> [!Warning]
> This project is highly experimental and will likely not work for your project.

## 🚀 How to use it

Install the `expo-atlas` package as (development) dependency to your project:

```bash
$ npx expo install expo-atlas
```

Configure your Metro config to emit a `.expo/stats.jsonl` file containing information about your bundles.

```js metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withExpoAtlas } = require('expo-atlas/metro');

const config = getDefaultConfig(__dirname);

// Add the `withExpoAtlas` from `expo-atlas/metro` as last change
module.exports = withExpoAtlas(config);
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

You can also open a previously created `stats.jsonl` file:

```
$ npx expo-atlas ./path/to/stats.jsonl
```

<div align="center">
  <br />
  with&nbsp;❤️&nbsp;&nbsp;<strong>byCedric</strong>
  <br />
</div>
