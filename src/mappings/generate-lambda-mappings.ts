import crypto from "crypto";
import File from "vinyl";
import { Duplex } from "stream";
import { readFileSync } from "fs";
import { Manifest } from "../next-build/manifest";
import addFiles from "../util/add-file";

function truncatedName(name: string) {
  // max name of lambdas should be less than 25 chars
  if (name.length < 25) {
    return name;
  }
  const hash = crypto
    .createHash("md5")
    .update(name)
    .digest("base64")
    .substr(0, 5)
    .replace(/[^\dA-Za-z]/g, ""); // Remove non-alphanumeric characters

  return `${name.substr(0, 19)}-${hash}`;
}

interface LambdaDescriptor {
  apifullpath: string[];
  handler: string;
  name: string;
}

export function generateMappingsFromManifest(
  manifest: Manifest,
  lambdaGroupName: string,
  buildIdArg: string
): Record<string, LambdaDescriptor[]> {
  const buildId = buildIdArg || readFileSync(".next/BUILD_ID", "utf8")?.trim();
  return {
    [lambdaGroupName]: Object.entries(manifest)
      .filter(([, value]) => value.endsWith(".js"))
      .filter(([key]) => key !== "/_error")
      .map(([key]) => {
        const name = key
          .replace(/^\//, "")
          .replace(/\//g, "-")
          .replace(/[^\dA-Za-z-]/g, "");

        const apifullpathData = key.replace(/\[([^\]]+)]/g, "{$1}");
        const TEMPLATE_PATH_REGEX = /{[^}]+}$/;
        const ending = TEMPLATE_PATH_REGEX.test(apifullpathData) ? "" : ".json";
        // Map nextjs dynamic route '[param1]' to '{param1}' to match OpenAPI 3 spec for Template Paths
        const apifullpath = [
          apifullpathData,
          `_next/data/${buildId}${apifullpathData}${ending}`,
        ];

        return {
          apifullpath,
          handler: `handlers${key}.render`,
          name: truncatedName(name),
        };
      })
      .sort((a, b) => a.apifullpath[0].localeCompare(b.apifullpath[0])),
  };
}

/**
 * Add a json file called lambda-mappings.json to the stream of files to be zipped
 * @param manifest The next.js manifest
 * @returns {Duplex} an object stream, suitable for gulp
 */
export function addMappingsFile(
  manifest: Manifest,
  lambdaGroupName: string,
  buildId = ""
): Duplex {
  const mappings = generateMappingsFromManifest(
    manifest,
    lambdaGroupName,
    buildId
  );
  return addFiles([
    new File({
      cwd: "/",
      base: "generated",
      path: "generated/lambda-mappings.json",
      contents: Buffer.from(JSON.stringify(mappings, null, 2)),
    }),
  ]);
}
