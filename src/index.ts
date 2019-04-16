#!/usr/bin/env node

import * as path from 'path';
import {Arguments, Argv, Options, scriptName} from 'yargs';
import {execFile} from 'child_process';
import ProcessEnv = NodeJS.ProcessEnv;

class EnvironmentOptions {
  APIKEY: string;
  RESOURCE_GROUP: string;
  CLUSTER_NAME: string;
  REGISTRY_URL: string;
  REGISTRY_NAMESPACE: string;
  REGION: string;
  CHART_ROOT: string;
  IMAGE_BUILD_NUMBER: string;
  IMAGE_NAME: string;
  IMAGE_VERSION: string;
  ENVIRONMENT_NAME: string;
}

class BaseOptions extends EnvironmentOptions {
  imageName: string;
  imageVersion: string;
  debug: boolean;
  quiet: boolean;
}

class BuildOptions extends BaseOptions {
  buildNumber: string;
}

class DeployOptions extends BaseOptions {
  environmentName: string;
}

type EnvironmentOptionKeys = keyof EnvironmentOptions;

const ENV_PROPERTIES: Array<EnvironmentOptionKeys> = [
  'APIKEY',
  'RESOURCE_GROUP',
  'REGION',
  'REGISTRY_NAMESPACE',
  'REGISTRY_URL',
  'CLUSTER_NAME',
  'CHART_ROOT',
  'IMAGE_BUILD_NUMBER'
];

function initializeArgumentsFromEnvironment(argv: Arguments<EnvironmentOptions>) {
  ENV_PROPERTIES
    .filter(function (name) {
      return !!process.env[name];
    })
    .forEach(function(name) {
      argv[name] = process.env[name];
    });
}

function buildOptionWithEnvDefault(key: string, options: Options): {[key: string]: Options} {
  const result = {};
  const defaultOption = process.env[key] || options.default;
  result[key] = Object.assign({}, options, defaultOption ? {default: defaultOption} : {});
  return result;
}

function withBaseOptions<T extends BaseOptions>(yargs: Argv<T>): Argv<T> {
  yargs
    .option(buildOptionWithEnvDefault('APIKEY', {
      alias: 'apiKey',
      describe: 'ApiKey for IBM Cloud login. Can also be provided as an environment property',
      required: true,
      type: 'string',
    }))
    .option(buildOptionWithEnvDefault('RESOURCE_GROUP', {
      alias: ['resourceGroup', 'rg'],
      describe: 'The IBM Cloud resource group for the login. Can also be provided as an environment property',
      required: true,
      type: 'string',
    }))
    .option(buildOptionWithEnvDefault('REGION', {
      alias: ['region', 'r'],
      describe: 'The IBM Cloud region for the login. The value defaults to "us-south" if not provided',
      type: 'string',
      default: 'us-south',
    }))
    .option(buildOptionWithEnvDefault('REGISTRY_URL', {
      alias: 'registry',
      describe: 'The host name for the IBM Cloud image registry. The value defaults to "us.icr.io" if not provided',
      type: 'string',
      default: 'us.icr.io',
    }))
    .option(buildOptionWithEnvDefault('REGISTRY_NAMESPACE', {
      alias: 'namespace',
      describe: 'The namespace to use within the IBM Cloud image registry. The value defaults to "default" if not provided',
      type: 'string',
      default: 'default',
    }))
    .option(buildOptionWithEnvDefault('IMAGE_NAME', {
      alias: ['imageName', 'image'],
      required: true,
      describe: 'The name of the image that will be built. Can be provided as an environment variable',
      type: 'string',
    }))
    .option(buildOptionWithEnvDefault('IMAGE_VERSION', {
      alias: ['imageVersion', 'ver'],
      required: true,
      describe: 'The version of the image that will be built. Can be provided as an environment variable',
      type: 'string',
    }))
    .option(buildOptionWithEnvDefault('IMAGE_BUILD_NUMBER', {
      alias: 'buildNumber',
      describe: 'The buildNumber that will be added to the image version, if provided. Can be provided as an environment variable',
      type: 'string',
    }))
    .option('debug', {
      describe: 'Turn on extra logging',
      type: 'boolean',
    })
    .option('quiet', {
      describe: 'Suppress all logging',
      type: 'boolean',
    });

  return yargs;
}

function extractEnvironmentProperties(argv: Arguments<EnvironmentOptions>): ProcessEnv {
  return ENV_PROPERTIES
    .reduce(
      (result: ProcessEnv, name: EnvironmentOptionKeys) => {
        result[name] = argv[name];
        return result;
      },
      process.env,
    );
}

scriptName('ibmcloud-image')
  .usage('$0 <cmd> [args]')
//    .middleware(initializeArgumentsFromEnvironment, true)
    .command(
      'build [args]',
      'build the image and push it into the IBM Cloud registry',
      (argv: Argv<BuildOptions>) => withBaseOptions(argv),
      (argv: Arguments<BuildOptions>) => {
        if (argv.debug) {
          console.log('arguments', argv);
        }
        execFile(
          path.join(__dirname, '../bin/build-image.sh'),
          [argv.imageName, argv.imageVersion],
          {env: extractEnvironmentProperties(argv)},
          (error, stdout, stderr) => {
            if (!argv.quiet) {
              console.log(stdout);
              console.error(stderr);
            }
            if (error) {
              console.log('error', error);
              process.exit(1);
            }
          });
        },
    )
    .command(
      'deploy [args]',
      'deploy an image from the IBM Cloud registry into a kubernetes cluster',
      (argv: Argv<DeployOptions>) => withBaseOptions(argv)
        .option(buildOptionWithEnvDefault('CLUSTER_NAME', {
          alias: 'cluster',
          required: true,
          describe: 'The cluster into which the image will be deployed. Can also be provided as an environment property',
          type: 'string',
        }))
        .option(buildOptionWithEnvDefault('CHART_ROOT', {
          alias: 'chartRoot',
          describe: 'The root directory where the chart is located, e.g. {CHART_ROOT}/{CHART_NAME}. Can also be provided as an environment property',
          type: 'string',
        }))
        .option(buildOptionWithEnvDefault('ENVIRONMENT_NAME', {
          alias: ['environmentName', 'env'],
          required: true,
          describe: 'The name of the environment into which the image will be deployed. Can also be provided as an environment property',
          type: 'string',
        })),
      (argv: Arguments<DeployOptions>) => {
        if (argv.debug) {
          console.log('arguments', argv);
        }
        execFile(
          path.join(__dirname, '../bin/deploy-image.sh'),
          [argv.imageName, argv.imageVersion, argv.environmentName],
          {env: extractEnvironmentProperties(argv)},
          (error, stdout, stderr) => {
            if (!argv.quiet) {
              console.log(stdout);
              console.error(stderr);
            }
            if (error) {
              console.log('error', error);
              process.exit(1);
            }
          });
      },
    )
    .command(
      'cr',
      'run the container-registry plugin',
      (argv: Argv<any>) => argv.option('debug', {
        alias: 'v',
        describe: 'Verbose logging',
        type: 'boolean'
      }),
      (argv: Arguments<any>) => {
        if (argv.debug) {
          console.log('arguments', argv);
        }
        execFile(
          'ibmcloud',
          ['cr'],
          {env: extractEnvironmentProperties(argv)},
          (error, stdout, stderr) => {
            if (!argv.quiet) {
              console.log(stdout);
              console.error(stderr);
            }
            if (error) {
              console.log('error', error);
              process.exit(1);
            }
          });
      }
    )
    .demandCommand()
    .help()
    .argv;