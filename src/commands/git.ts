import {Arguments, Argv} from 'yargs';
import {Container} from 'typescript-ioc';
import * as open from 'open';

import {CommandLineOptions} from '../model';
import {GetGitParameters} from '../services/git-secret';
import {isNoGitRepoError} from '../services/git-secret/git-parameters.impl';

export const command = 'git [remote]';
export const desc = 'Launches a browser to the git repo url specified by the remote. If not provided remote defaults to origin';
export const builder = (argv: Argv<any>) => argv
  .positional('remote', {
    require: false,
    default: 'origin',
    describe: 'The name of the remote that should be opened',
  });
exports.handler = async (argv: Arguments<{remote: string} & CommandLineOptions>) => {
  const gitParams: GetGitParameters = Container.get(GetGitParameters);

  try {
    const gitConfig = await gitParams.getGitConfig(argv.remote);
    if (!gitConfig || !gitConfig.url) {
      console.log('Unable to find git repo config');
      return
    }

    console.log('Launching git repo url: ' + gitConfig.url);
    open(gitConfig.url);
  } catch (err) {
    if (isNoGitRepoError(err)) {
      console.log('No git configuration found. The current directory does not appear to be a git repository.')
    } else {
      console.log('Error retrieving git repository information')
    }
  }
};
