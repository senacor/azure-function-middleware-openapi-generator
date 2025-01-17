import { configurationJoiSchema } from './Configuration';

describe('configurationJoiSchema should', () => {
    test('should identify valid configuration', () => {
        const result = configurationJoiSchema.validate({
            apiDefinitions: [
                {
                    title: 'Test API',
                    description: 'API description',
                    servers: [
                        {
                            url: 'https://{{tenant}}.example.com',
                            description: 'Prod server',
                            variables: {
                                tenant: {
                                    default: 'www',
                                    description: 'Your tenant id',
                                },
                            },
                        },
                        {
                            url: 'https://test.example.com',
                            description: 'Test server',
                        },
                    ],
                    outputFile: 'api.yaml',
                    functionNameRegexToInclude: ['^http-.*$'],
                    functionNameRegexToExclude: ['^http-internal-.*$'],
                },
            ],
        });

        expect(result.error).toBeUndefined();
    });

    test('should identify invalid configuration with missing title', () => {
        const result = configurationJoiSchema.validate({
            apiDefinitions: [
                {
                    description: 'API description',
                    functionNameRegexToInclude: ['^http-.*$'],
                    functionNameRegexToExclude: ['^http-internal-.*$'],
                },
            ],
        });

        expect(result.error?.message).toEqual('"apiDefinitions[0].title" is required');
    });

    test('should identify invalid configuration with invalid output file type', () => {
        const result = configurationJoiSchema.validate({
            apiDefinitions: [
                {
                    title: 'Test API',
                    outputFile: 'api.xml',
                },
            ],
        });

        expect(result.error?.message).toEqual(
            '"apiDefinitions[0].outputFile" with value "api.xml" fails to match the required pattern: /^.*((.yaml)|(.json))$/',
        );
    });
});
