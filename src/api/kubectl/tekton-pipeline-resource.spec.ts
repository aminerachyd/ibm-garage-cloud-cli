import {Container} from 'typescript-ioc';

import {mockKubeClientProvider} from './testHelper';
import {KubeClient} from './client';
import {KubeTektonTask} from "./tekton-task";
import {KubeTektonPipeline} from "./tekton-pipeline";
import {KubeTektonPipelineResource} from './tekton-pipeline-resource';

describe('tekton-pipeline-resource', () => {
  test('canary verifies test infrastructure', () => {
    expect(true).toEqual(true);
  });

  describe('given KubeTektonPipelineResource', () => {
    let classUnderTest: KubeTektonPipelineResource;

    beforeEach(() => {
      Container
        .bind(KubeClient)
        .provider(mockKubeClientProvider);

      classUnderTest = Container.get(KubeTektonPipelineResource);
    });
  });
});
