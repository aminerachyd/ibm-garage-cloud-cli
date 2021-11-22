import {Arguments} from 'yargs';
import {Container} from 'typescript-ioc';

import {GitOpsModuleApi, GitOpsModuleOptions} from '../../services/gitops-module';
import {Logger, verboseLoggerFactory} from '../../util/logger';
import {ClaimedMutex, IMutex, Mutex, NoopMutex} from '../../util/mutex';
import {GitopsModulePRImpl} from '../../services/gitops-module/gitops-module-pr.impl';

export const commonHandler = async (argv: Arguments<GitOpsModuleOptions & {debug: boolean, lock: string}>) => {
  Container.bind(Logger).factory(verboseLoggerFactory(argv.debug));
  if (argv.lock === 'branch' || argv.lock === 'b') {
    Container.bind(GitOpsModuleApi).to(GitopsModulePRImpl);
  }

  const logger: Logger = Container.get(Logger);

  const mutex: IMutex = createMutex(argv.lock, argv.tmpDir, 'gitops-module', logger);

  let claim: ClaimedMutex;
  try {
    claim = await mutex.claim({name: argv.name, namespace: argv.namespace, contentDir: argv.contentDir});

    const service: GitOpsModuleApi = Container.get(GitOpsModuleApi);

    await service.populate(argv);
  } catch (err) {
    console.error('Error running populate', err);
  } finally {
    await claim.release();
  }
};

function createMutex(lock: string, tmpDir: string, scope: string, logger: Logger): IMutex {
  if (lock === 'pessimistic' || lock === 'p') {
    return new Mutex(tmpDir, scope, logger);
  }

  return new NoopMutex();
}
