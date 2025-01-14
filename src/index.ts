import { readAppFunctions } from './readAppFunctions';
import fs from 'node:fs';
import { generateApiDefinitions } from './generateApiDefinition';
import { readConfiguration } from './readConfiguration';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const configuration = readConfiguration();

const appFunctions = readAppFunctions(packageJson.main);

generateApiDefinitions(configuration, appFunctions, packageJson.version);
