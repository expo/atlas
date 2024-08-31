# Expo Atlas

Inspect your Metro bundle, on module level.

> [!Warning]
> This project is unstable and might not work for your project.

## 🚀 How to use it

Atlas is built into Expo starting from SDK 51, and enabled when defining the environment variable `EXPO_UNSTABLE_ATLAS=true`.

You can use Atlas with two Expo commands:
- `$ expo start` → Start a local dev server, Atlas will listen to any change within your project.
- `$ expo export` → Export your app to Android, iOS, or web. Atlas will generate the `atlas.jsonl` file.

### Using `$ expo start`

When enabling Atlas with the local dev server, you can access Atlas on [http://localhost:8081/_expo/atlas](http://localhost:8081/_expo/atlas). This shows you all information from the bundle loaded during development.

```bash
$ EXPO_UNSTABLE_ATLAS=true npx expo start
```

> [!TIP]
> Expo start runs in development mode by default. If you want to see a production bundle of your app, you can start the local dev server in production mode: `$ expo start --no-dev`.

### Using `$ expo export`

When enabling Atlas during exports, Expo generates the `.expo/atlas.json` file in your project. This file contains all bundle information, including the actual source code of individual files. You can open the Atlas file through `npx expo-atlas [path/to/atlas.jsonl]`.

```bash
# Export the app for all platforms
$ EXPO_UNSTABLE_ATLAS=true npx expo export --platform all

# Open Atlas using the default `.expo/atlas.jsonl` path
$ npx expo-atlas
# Open Atlas from a shared file
$ npx expo-atlas ./path/to/atlas.jsonl
```

## 🏛️ Project structure

- [`apps/example`](./apps/example) — A default Expo project, with Atlas enabled by default
- [`packages/expo-atlas`](./packages/expo-atlas) — The core package of Atlas, including Metro data handling and the CLI command
- [`packages/expo-atlas-ui`](./packages/expo-atlas-ui) — The web-only Expo project representing the UI of Atlas

## 🧑‍💻 Contributing to Atlas

Expo Atlas is open source and contributions are welcome.

### Preparing the repository

- Clone this repository
- `$ bun install` — Atlas uses [Bun](https://bun.sh/)'s package manager, ensure you have it installed

### 🎨 Changing the Atlas UI

If you need to change anything related to the Atlas UI, you need to:

- `$ bun start` — This builds [**expo-atlas**](./packages/expo-atlas) and starts [**expo-atlas-ui**](./packages/expo-atlas-ui) with a [default fixture](./packages/expo-atlas-ui/_fixtures)
- `$ open http://localhost:8081` — To view [**expo-atlas-ui**](./packages/expo-atlas-ui) in your browser
- Make any change in [**expo-atlas-ui**](./packages/expo-atlas-ui)

### 📊 Changing the Atlas data

If you need to change anything related to extracting data from Metro, you need to:

- `$ cd packages/expo-atlas` — Make the changes in [**expo-atlas**](./packages/expo-atlas)
- `$ bun start` — Build [**expo-atlas**](./packages/expo-atlas) on any change
- Open another terminal
- `$ cd apps/example` — Atlas has a default Expo project to experiment with
- `$ bun start` — The example project automatically enables Atlas through [**apps/example/.env**](./apps/example/.env)
  - `$ bun expo export` — The example project can also export an **.expo/atlas.jsonl** file
  - `$ bun expo-atlas` — When exporting an **.expo/atlas.jsonl** file, you can open Atlas using this export

### 📦 Releasing a new version

If you need to release a new version of Atlas, you need to:

- Make sure you have no uncomitted changes and have checked out **main**
- Update the package version in [**expo-atlas/package.json**](./packages/expo-atlas/package.json)
- Commit the new version to **main**
- `$ bun install` — Make sure to install all dependencies
- `$ bun run build` — Build both [**expo-atlas**](./packages/expo-atlas) and [**expo-atlas-ui**](./packages/expo-atlas-ui)
- `$ cd packages/expo-atlas && npm publish` — Release a new version of Atlas

<div align="center">
  <br />
  with&nbsp;❤️&nbsp;&nbsp;<strong>Expo</strong>
  <br />
</div>
