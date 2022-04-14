import { generateMappingsFromManifest } from "../../mappings/generate-lambda-mappings";
import expectedOutput from "../testdata/test1-lambda-mapping.json";
import expectedCustomOutput from "../testdata/test2-lambda-mapping.json";
import { readManifestSync } from "../../next-build/manifest";

describe("The processor", () => {
  it("should match expected output with default lambda group name", () => {
    const manifest = readManifestSync(
      "src/__test__/testdata/test1-pages-manifest.json"
    );
    const result = generateMappingsFromManifest(
      manifest,
      "lambda_function_group"
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
  it("should match expected output with custom lambda group name", () => {
    const manifest = readManifestSync(
      "src/__test__/testdata/test2-pages-manifest.json"
    );
    const result = generateMappingsFromManifest(
      manifest,
      "weblambda_function_group"
    );
    for (let i = 0; i < result.weblambda_function_group.length; i += 1) {
      expect(
        expectedCustomOutput.weblambda_function_group[i].apifullpath[0]
      ).toEqual(result.weblambda_function_group[i].apifullpath[0]);
      expect(
        expectedCustomOutput.weblambda_function_group[i].apifullpath[1]
      ).toMatch(/^_next\/data\//);
      expect(result.weblambda_function_group[i].apifullpath[1]).toMatch(
        /^_next\/data\//
      );
      expect(expectedCustomOutput.weblambda_function_group[i].handler).toEqual(
        result.weblambda_function_group[i].handler
      );
      expect(expectedCustomOutput.weblambda_function_group[i].name).toEqual(
        result.weblambda_function_group[i].name
      );
    }
  });
});
