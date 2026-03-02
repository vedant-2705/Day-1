import swaggerJSDoc, { Options } from "swagger-jsdoc";
import YAML from "yamljs";
import path from "path";

const swaggerDefinition = YAML.load(path.join(process.cwd(), "./src/docs/openapi.yaml"));

// 2. Pass it into the options
const swaggerOptions: Options = {
    swaggerDefinition,
    apis: ["./src/docs/**/*.yaml"],
};

export const swaggerSpecYaml = swaggerJSDoc(swaggerOptions);

