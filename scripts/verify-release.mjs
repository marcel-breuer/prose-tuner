import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const packageLock = JSON.parse(
  await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'),
);
const versionPattern = /^0\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!versionPattern.test(packageJson.version)) {
  throw new Error(`package.json version must be a valid v0 semver value: ${packageJson.version}`);
}
if (packageLock.packages?.['']?.version !== packageJson.version) {
  throw new Error('package-lock.json root version must match package.json.');
}

const tag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined;
if (tag !== undefined && tag !== `v${packageJson.version}`) {
  throw new Error(`Release tag ${tag} must match package version v${packageJson.version}.`);
}

console.log(`Release metadata is valid for v${packageJson.version}.`);
