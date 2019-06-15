import {Arguments, Argv, CommandModule} from 'yargs';
import {DefaultOptionBuilder, YargsCommandDefinition} from '../../util/yargs-support';
import {RegisterPipelineOptions} from './register-pipeline-options.model';
import {registerPipeline} from './register-pipeline';

export const defineRegisterPipelineCommand: YargsCommandDefinition = <T>(command: string): CommandModule<T> => {
  return {
    command,
    describe: 'register the pipeline in Jenkins for the repo',
    builder: (yargs: Argv<any>) => new DefaultOptionBuilder<RegisterPipelineOptions>(yargs)
      .apiKey()
      .resourceGroup()
      .region()
      .clusterName()
      .clusterNamespace()
      .debug()
      .quiet()
      .build(),
    handler: async (argv: Arguments<RegisterPipelineOptions>) => {
      await registerPipeline(argv);
    }
  };
};
