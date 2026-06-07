#!/usr/bin/env node
/**
 * Clean native builds for Expo SDK 56.
 *
 * Usage:
 *   npm run clean                  # Metro / Expo caches only
 *   npm run clean:native           # caches + android/ + ios/
 *   npm run build:android:debug    # clean prebuild + debug APK
 *   npm run build:android:release  # clean prebuild + release APK
 *   npm run build:ios:debug        # clean prebuild + debug (macOS + Xcode)
 *   npm run build:ios:release      # clean prebuild + Release
 *   npm run start:clean            # expo start --clear (Expo Go / dev client)
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const cmd = args[0] ?? 'help';
const platform = args[1]; // android | ios
const variant = args[2]; // debug | release

function rmrf(relativePath) {
  const target = path.join(ROOT, relativePath);
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`  removed ${relativePath}`);
}

function run(label, command, commandArgs, env = process.env) {
  console.log(`\n→ ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function cleanCaches() {
  console.log('\nCleaning Expo / Metro caches…');
  rmrf('.expo');
  rmrf('node_modules/.cache');
}

function cleanNative() {
  cleanCaches();
  console.log('\nRemoving native project folders…');
  rmrf('android');
  rmrf('ios');
}

function prebuild(platformName) {
  run(`expo prebuild --clean (${platformName})`, 'npx', [
    'expo',
    'prebuild',
    '--clean',
    '--platform',
    platformName,
  ]);
}

function runAndroid(release) {
  const runArgs = ['expo', 'run:android'];
  if (release) {
    runArgs.push('--variant', 'release');
  }
  run(release ? 'Install Android release' : 'Install Android debug', 'npx', runArgs);
}

function runIos(release) {
  const runArgs = ['expo', 'run:ios'];
  if (release) {
    runArgs.push('--configuration', 'Release');
  }
  run(release ? 'Install iOS Release' : 'Install iOS debug', 'npx', runArgs);
}

function build(platformName, release) {
  const label = `${platformName} ${release ? 'release' : 'debug'}`;
  console.log(`\nClean ${label} build`);
  console.log('='.repeat(label.length + 12));

  cleanCaches();
  prebuild(platformName);

  if (platformName === 'android') {
    runAndroid(release);
  } else {
    runIos(release);
  }

  console.log(`\nDone — ${label} installed.\n`);
}

function printHelp() {
  console.log(`
Expo clean build
================

  npm run clean                  Clear .expo + Metro cache
  npm run clean:native           Above + delete android/ and ios/
  npm run start:clean            expo start --clear

  npm run build:android:debug    Fresh prebuild + debug APK → device/emulator
  npm run build:android:release  Fresh prebuild + release APK
  npm run build:ios:debug        Fresh prebuild + iOS debug (macOS)
  npm run build:ios:release      Fresh prebuild + iOS Release

Quick dev (no native rebuild):
  npm run android                expo run:android (existing android/ project)
  npm start                      Expo Go / dev client

Requires: Android SDK / Xcode, device or emulator connected.
`);
}

switch (cmd) {
  case 'clean':
    cleanCaches();
    console.log('\nCache clean complete.\n');
    break;
  case 'clean:native':
    cleanNative();
    console.log('\nNative + cache clean complete.\n');
    break;
  case 'android':
    if (variant === 'release') {
      build('android', true);
    } else if (variant === 'debug' || !variant) {
      build('android', false);
    } else {
      console.error('Use: android debug | android release');
      process.exit(1);
    }
    break;
  case 'ios':
    if (variant === 'release') {
      build('ios', true);
    } else if (variant === 'debug' || !variant) {
      build('ios', false);
    } else {
      console.error('Use: ios debug | ios release');
      process.exit(1);
    }
    break;
  case 'help':
  default:
    printHelp();
    break;
}
