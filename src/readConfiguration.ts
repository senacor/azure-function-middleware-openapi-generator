import fs from 'node:fs';
import { Configuration, configurationJoiSchema } from './Configuration';

const configFileName = 'openapi-generation.config.json';

export function readConfiguration(): Configuration {
    const configuration = JSON.parse(fs.readFileSync(configFileName, 'utf-8'));

    const validationResult = configurationJoiSchema.validate(configuration);
    if (validationResult.error) {
        console.error(`Configuration is invalid: ${validationResult.error.message}`);
        throw new Error('Invalid configuration');
    }

    return configuration;
}
