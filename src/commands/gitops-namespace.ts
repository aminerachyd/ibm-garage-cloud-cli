import {Arguments, Argv} from 'yargs';

import {GitOpsModuleOptions} from '../services/gitops-module';
import {defaultAutoMerge, commonHandler, defaultRateLimit} from './support/gitops-module-common';

export const command = 'gitops-namespace [name]';
export const desc = 'Populates the gitops repo with the configuration for a namespace';
export const builder = (yargs: Argv<any>) => {
  return yargs
    .positional('name', {
      description: 'The name of the module that will be added to GitOps',
      type: 'string',
      demandOption: true,
    })
    .option('contentDir', {
      alias: ['c', "content"],
      description: 'The directory or url where the payload content has been placed. If not provided defaults to current working directory.',
      type: 'string',
      demandOption: false,
    })
    .option('namespace', {
      alias: 'n',
      type: 'string',
      describe: 'Namespace where the secret should be created',
      demandOption: false,
      default: 'default'
    })
    .option('gitopsConfigFile', {
      describe: 'Name of yaml or json file that contains the gitops config values',
      type: 'string',
      conflicts: 'bootstrapRepoUrl',
      demandOption: false,
    })
    .option('bootstrapRepoUrl', {
      describe: 'Url of the bootstrap repo that contains the gitops config yaml',
      type: 'string',
      conflicts: 'gitopsConfigFile',
      demandOption: false,
    })
    .option('gitopsCredentialsFile', {
      describe: 'Name of yaml or json file that contains the gitops credentials',
      type: 'string',
      conflicts: 'token',
      demandOption: false,
    })
    .option('token', {
      describe: 'Git personal access token to access gitops repo',
      type: 'string',
      conflicts: 'gitopsCredentialsFile',
      demandOption: false,
    })
    .option('applicationPath', {
      describe: 'The path within the payload directory structure where the payload config should be placed. If not provided will default to `name`',
      type: 'string',
      demandOption: false,
    })
    .option('branch', {
      describe: 'The branch where the payload has been deployed',
      demandOption: false,
    })
    .option('serverName', {
      describe: 'The name of the cluster. If not provided will use `default`',
      demandOption: false,
    })
    .option('valueFiles', {
      describe: 'Comma-separated list of value files that should be applied to the Argo CD application if using a helm chart',
      demandOption: false,
    })
    .option('lock', {
      describe: 'Git repo locking style',
      demandOption: false,
      choices: ['optimistic', 'pessimistic', 'branch', 'o', 'p', 'b'],
      default: process.env.LOCK || 'branch',
    })
    .option('autoMerge', {
      describe: 'Flag indicating that the branch/PR should be automatically merged. Only applies if lock strategy is branch',
      type: 'boolean',
      demandOption: false,
      default: defaultAutoMerge(),
    })
    .option('delete', {
      alias: 'd',
      describe: 'Flag indicating that the content should be deleted from the repo',
      type: 'boolean',
      demandOption: false,
      default: false,
    })
    .option('ignoreDiff', {
      describe: 'JSON string containing the ignoreDifferences block for the ArgoCD application. The value can also be passed via a IGNORE_DIFF environment variable',
      type: 'string',
      demandOption: false,
      default: process.env.IGNORE_DIFF,
    })
    .option('rateLimit', {
      describe: 'Flag indicating that the calls to the git api should be rate limited.',
      type: 'boolean',
      demandOption: false,
      default: defaultRateLimit(),
    })
    .option('cascadingDelete', {
      describe: 'Flag indicating that the GitOps application should be configured to perform a cascading delete.',
      type: 'boolean',
      demandOption: false,
      default: true,
    })
    .option('tmpDir', {
      describe: 'The temp directory where the gitops repo should be checked out',
      type: 'string',
      default: '/tmp/gitops-module/',
      require: false,
    })
    .option('debug', {
      describe: 'Turn on debug logging',
      type: 'boolean',
      require: false,
    });
};
exports.handler = async (argv: Arguments<GitOpsModuleOptions & {debug: boolean, lock: string}>) => {
  const args: Arguments<GitOpsModuleOptions & {debug: boolean, lock: string}> = Object.assign(
    {},
    argv,
    {
      isNamespace: true,
      layer: 'infrastructure',
    });

  await commonHandler(args);
};
