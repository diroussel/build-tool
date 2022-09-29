import { generateMappingsFromManifest } from '../../mappings/generate-lambda-mappings';
import expectedOutput from '../testdata/test1-lambda-mapping.json';
import expectedCustomOutput from '../testdata/test2-lambda-mapping.json';
import { readManifestSync } from '../../next-build/manifest';

describe('The processor', () => {
  it('should match expected output with default lambda group name', () => {
    const buildId = 'someBuildId-x27b';
    const manifest = readManifestSync(
      'src/__test__/testdata/test1-pages-manifest.json'
    );
    const result = generateMappingsFromManifest(
      manifest,
      'lambda_function_group',
      buildId
    );
    for (let i = 0; i < result.lambda_function_group.length; i += 1) {
      expect(expectedOutput.lambda_function_group[i].apifullpath[0]).toEqual(
        result.lambda_function_group[i].apifullpath[0]
      );
      expect(expectedOutput.lambda_function_group[i].apifullpath[1]).toMatch(
        /^_next\/data\//
      );
      expect(result.lambda_function_group[i].apifullpath[1]).toMatch(
        /^_next\/data\//
      );
      expect(expectedOutput.lambda_function_group[i].handler).toEqual(
        result.lambda_function_group[i].handler
      );
      expect(expectedOutput.lambda_function_group[i].name).toEqual(
        result.lambda_function_group[i].name
      );
    }
  });
  it('should match expected output with custom lambda group name', () => {
    const buildId = 'anotherBuildId-a42y';
    const manifest = readManifestSync(
      'src/__test__/testdata/test2-pages-manifest.json'
    );
    const result = generateMappingsFromManifest(
      manifest,
      'weblambda_function_group',
      buildId
    );
    expect(result.weblambda_function_group[1].apifullpath[1]).toMatch(
      `_next/data/${buildId}/ras/journey1.json`
    );

    for (let i = 0; i < result.weblambda_function_group.length; i += 1) {
      expect(result.weblambda_function_group[i].apifullpath[0]).toEqual(
        expectedCustomOutput.weblambda_function_group[i].apifullpath[0]
      );
      expect(
        expectedCustomOutput.weblambda_function_group[i].apifullpath[1]
      ).toMatch(/^_next\/data\//);
      expect(result.weblambda_function_group[i].apifullpath).toEqual(
        expectedCustomOutput.weblambda_function_group[i].apifullpath
      );
      expect(result.weblambda_function_group[i].handler).toEqual(
        expectedCustomOutput.weblambda_function_group[i].handler
      );
      expect(result.weblambda_function_group[i].name).toEqual(
        expectedCustomOutput.weblambda_function_group[i].name
      );
    }
  });
});
