import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';

const ZXING_POD_NAME = 'ZXingObjC';
const ZXING_POD_LINE = `pod '${ZXING_POD_NAME}', :modular_headers => true`;

function hasPod(podfile: string, podName: string): boolean {
  return podfile.includes(`pod '${podName}'`) || podfile.includes(`pod "${podName}"`);
}

function injectBarcodeScanningPods(podfile: string): string {
  const useExpoModulesMatch = podfile.match(/^(\s*)use_expo_modules!.*$/m);
  if (!useExpoModulesMatch || useExpoModulesMatch.index === undefined) {
    throw new Error(
      '[withExpoCameraBarcodeScanning] Could not find use_expo_modules! in ios/Podfile.',
    );
  }

  const podLinesToInsert = [
    !hasPod(podfile, ZXING_POD_NAME) ? ZXING_POD_LINE : null,
  ].filter(Boolean);

  if (podLinesToInsert.length === 0) {
    return podfile;
  }

  const indent = useExpoModulesMatch[1] ?? '';
  const insertAt = useExpoModulesMatch.index + useExpoModulesMatch[0].length;
  const insertion = podLinesToInsert.map(line => `${indent}${line}`).join('\n');

  return `${podfile.slice(0, insertAt)}\n${insertion}${podfile.slice(insertAt)}`;
}

const withExpoCameraBarcodeScanning: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      const platformRoot = config.modRequest.platformProjectRoot;
      const podfilePath = path.join(platformRoot, 'Podfile');
      const podfile = await fs.promises.readFile(podfilePath, 'utf8');
      const updatedPodfile = injectBarcodeScanningPods(podfile);

      if (updatedPodfile !== podfile) {
        await fs.promises.writeFile(podfilePath, updatedPodfile, 'utf8');
      }

      return config;
    },
  ]);
};

export default withExpoCameraBarcodeScanning;
