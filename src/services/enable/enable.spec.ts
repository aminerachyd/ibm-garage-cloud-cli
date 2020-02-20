import {Container, Provider} from 'typescript-ioc';
import * as superagent from 'superagent';
import * as YAML from 'js-yaml';

import {EnablePipelineImpl} from './enable';
import {mockField, providerFromValue} from '../../testHelper';
import {QuestionBuilder} from '../../util/question-builder';
import Mock = jest.Mock;

jest.mock('superagent');

describe('enable', () => {
  test('canary verifies test infrastructure', () => {
    expect(true).toEqual(true);
  });

  describe('EnablePipeline', () => {
    let classUnderTest: EnablePipelineImpl;
    let questionBuilder: QuestionBuilder<any>;
    beforeEach(() => {
      questionBuilder =  {
        prompt: jest.fn(),
        question: jest.fn().mockReturnThis(),
      };
      Container.bind(QuestionBuilder).provider(providerFromValue(questionBuilder));

      classUnderTest = Container.get(EnablePipelineImpl);
    });

    describe('given enable()', () => {
      describe('when options.repo is undefined', () => {
        test('then throw an error', async () => {
          return classUnderTest.enable({} as any)
            .then(value => fail('should throw error'))
            .catch(err => expect(err.message).toEqual('value required for \'repo\''));
        });
      });

      describe('when options.repo is defined', () => {
        const options = {repo: 'repo-path', pipeline: 'pipeline-name'};
        
        let getPipelinePath;
        let applyPipeline;
        beforeEach(() => {
          getPipelinePath = mockField(classUnderTest, 'getPipelinePath');
          applyPipeline = mockField(classUnderTest, 'applyPipelineToCurrentDirectory');
        });

        test('then should get the pipeline path and apply the pipeline', async () => {
          const pipelinePath = 'pipeline-path';
          getPipelinePath.mockResolvedValue({pipelinePath});
          
          await classUnderTest.enable(options);

          expect(applyPipeline).toHaveBeenCalledWith(pipelinePath);
        });
      })
    });

    describe('given getPipelinePath()', () => {
      let getPipelineRepoIndex;
      let promptForPipelineName;
      beforeEach(() => {
        getPipelineRepoIndex = mockField(classUnderTest, 'getPipelineRepoIndex');
        promptForPipelineName = mockField(classUnderTest, 'promptForPipelineName');
      });

      describe('when called with {repo: "repo-url", pipeline: "pipeline"}', () => {
        const options = {repo: 'repo-url', pipeline: 'pipeline'};

        test('then retrieve the pipeline path from the pipeline index', async () => {
          const index = {index: 'value'};
          const expectedResult = 'pipeline-path';

          getPipelineRepoIndex.mockResolvedValue(index);
          promptForPipelineName.mockResolvedValue(expectedResult);

          const actualResult = await classUnderTest.getPipelinePath(options);

          expect(actualResult).toEqual(expectedResult);
          expect(promptForPipelineName).toHaveBeenCalledWith(index, options.pipeline);
        });
      });
    });

    describe('given getPipelineRepoIndex()', () => {
      describe('when repo url is valid', () => {
        test('then return the JSON value of the repo index yaml', async () => {
          const repoUrl = 'http://repo.url';
          const expectedResult = {
            name: 'repo',
            nodejs: {
              path: `${repoUrl}/nodejs.tar.gz`
            },
          };

          (superagent as any).__setMockResponse({text: YAML.safeDump(expectedResult)});

          const actualResult = await classUnderTest.getPipelineRepoIndex(repoUrl);

          expect(actualResult).toEqual(expectedResult);
          expect(superagent.get).toHaveBeenCalledWith(`${repoUrl}/index.yaml`);
        });
      });

      describe.skip('when there is an error loading the repo yaml', () => {
        test('then throw an error', async () => {
          (superagent as any).__setMockError(new Error('http error'));

          const repoUrl = 'repoUrl';
          return classUnderTest.getPipelineRepoIndex(repoUrl)
            .then(value => fail('should throw an error'))
            .catch(err => expect(err.message).toEqual(`Error loading pipeline index from ${repoUrl}`))
        });
      });
    });

    describe('given promptForPipelineName()', () => {
      describe('when pipeline is undefined', () => {
        test('then throw an error', async () => {
          return classUnderTest.promptForPipelineName()
            .then(value => fail('should throw error'))
            .catch(err => expect(err.message).toEqual('No pipelines found in repo'));
        });
      });
      describe('when pipeline indicies is undefined', () => {
        test('then throw an error', async () => {
          return classUnderTest.promptForPipelineName({})
            .then(value => fail('should throw error'))
            .catch(err => expect(err.message).toEqual('No pipelines found in repo'));
        });
      });
      describe('when pipeline indicies are empty', () => {
        test('then throw error', async () => {
          return classUnderTest.promptForPipelineName({name: 'name', pipelines: {}})
            .then(value => fail('should throw error'))
            .catch(err => expect(err.message).toEqual('No pipelines found in repo'));
        });
      });
      describe('when pipeline indicies are provided', () => {
        test('then prompt the user to pick the pipeline from the list', async () => {
          const url = 'pipelineUrl';
          const index = {pipelines: {nodejs: {url}}};
          const selectedPipeline = 'nodejs';

          (questionBuilder.prompt as Mock).mockResolvedValue({pipeline: selectedPipeline});

          const actualResult = await classUnderTest.promptForPipelineName(index);

          expect(actualResult).toEqual({pipelineName: 'nodejs', pipelinePath: url});
        });
      });
    });
  });
});