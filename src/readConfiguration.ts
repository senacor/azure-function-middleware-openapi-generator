import fs from 'node:fs';
import { Configuration, configurationJoiSchema } from './Configuration';

const configFileName = 'openapi-generation.config.json';

export function readConfiguration(): Configuration {
    return JSON.parse(fs.readFileSync(configFileName, 'utf-8'));
}