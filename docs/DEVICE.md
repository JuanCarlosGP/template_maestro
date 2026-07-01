# Device and platform CLI (optional)

The template contract is **npm only** — see [README](../README.md) and [`docs/CI.md`](CI.md).

This page documents **manual platform commands** for local device work on macOS/Linux (WSL). On Windows, use Android Studio / Xcode GUIs for emulators and installs.

Requires `.env` filled in (see [`.env.example`](../.env.example)).

## npm — tests and quality

```bash
npm run setup
npm run check
npm run validate
npm run doctor
npm run demo-login
npm run feature -- --feature maestro/features/DemoLogin.feature --platform ios --no-publish
npm run flow:android -- --flow maestro/flows/DemoLogin.yml
npm run flow:ios -- --flow maestro/flows/DemoLogin.yml
npm run gherkin-extract
npm run gherkin-report
```

## Azure suite (full plan)

```bash
node maestro/scripts/gherkin-runner.js \
  --from-suite \
  --plan-id $PLAN_ID \
  --suite-id $SUITE_ID \
  --platform all \
  --no-publish
```

Set `PLAN_ID`, `SUITE_ID`, credentials in `.env`. Omit `--no-publish` to publish results.

## Android emulator

Start (adjust AVD name):

```bash
emulator -avd Small_Phone &
```

Stop:

```bash
adb emu kill
```

List AVDs: `emulator -list-avds`

## iOS simulator

Boot (adjust device name):

```bash
xcrun simctl boot "iPhone 14"
open -a Simulator
```

List devices: `xcrun simctl list devices`

## Copy builds into the repo

Set `ANDROID_SRC`, `IOS_SRC`, `ANDROID_BUILD`, `IOS_BUILD` in `.env`, then:

```bash
mkdir -p build/android build/ios
cp "$ANDROID_SRC" "$ANDROID_BUILD"
rm -rf "$IOS_BUILD"
cp -r "$IOS_SRC" "$IOS_BUILD"
```

## Install app on device

Android:

```bash
adb install build/android/demo.apk
```

iOS (simulator booted):

```bash
xcrun simctl install booted build/ios/DemoApp.app
```

## Maestro CLI

Installed via `npm run setup` on macOS/Linux, or manually on Windows: [Maestro docs](https://docs.maestro.dev/getting-started/installing-maestro).

Pinned version: see `MAESTRO_VERSION` in [`maestro/scripts/install-maestro.js`](../maestro/scripts/install-maestro.js).
