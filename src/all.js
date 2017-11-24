// @flow

import { removeAllListeners, addListener } from 'storyboard';
import parallelConsoleListener from 'storyboard-listener-console-parallel';
import { readAllSpecs } from './utils/readSpecs';
import { exec } from './utils/shell';
import calcGraph from './utils/calcGraph';

type Options = {
  src: string,
  ignoreSrc?: string,
  tree?: boolean,
  parallel?: boolean,
  parallelLogs?: boolean,
  ignoreErrors?: boolean,
};

const run = async (
  cmd: string,
  { src, ignoreSrc, tree, parallel, parallelLogs, ignoreErrors }: Options
) => {
  if (parallel && parallelLogs) {
    removeAllListeners();
    addListener(parallelConsoleListener);
  }
  const allSpecs = await readAllSpecs(src, ignoreSrc, false);
  const pkgNames = tree ? calcGraph(allSpecs) : Object.keys(allSpecs);
  const allPromises = [];
  for (let i = 0; i < pkgNames.length; i += 1) {
    const pkgName = pkgNames[i];
    const { pkgPath } = allSpecs[pkgName];
    let promise = exec(cmd, { cwd: pkgPath, bareLogs: parallelLogs });
    if (ignoreErrors) promise = promise.catch(() => {});
    if (!parallel) {
      await promise;
    } else {
      allPromises.push(promise);
    }
  }

  // If parallel logs are enabled, we have to manually exit
  if (parallel && parallelLogs) {
    await Promise.all(allPromises);
    process.exit(0);
  }
};

export default run;
