import { generateApiDefinition } from './generateApiDefinition';
import { ApiDefinitionConfiguration } from './Configuration';
import { AppFunctions } from './readAppFunctions';
import Joi from 'joi';

describe('generateApiDefinition should', () => {
    const config: ApiDefinitionConfiguration = {
        title: 'Test API',
        outputFile: 'test.yaml',
    };

    test('generate api definition for http endpoint without validations', () => {
        const appFunctions: AppFunctions = {
            httpFunctions: [
                {
                    name: 'http-get-test',
                    options: {
                        authLevel: 'function',
                        methods: ['GET'],
                        route: 'test/{id}',
                        handler: async () => ({ status: 200 }),
                    },
                    validations: {
                        hasJwtAuthorization: false,
                    },
                },
            ],
        };

        const result = generateApiDefinition(config, appFunctions, '1.0.0');

        expect(result).toMatchSnapshot();
    });

    test('generate api definition for http endpoint with url and query params', () => {
        const appFunctions: AppFunctions = {
            httpFunctions: [
                {
                    name: 'http-get-test',
                    options: {
                        authLevel: 'function',
                        methods: ['GET'],
                        route: 'person/{personId}/order/{orderId}/item',
                        handler: async () => ({ status: 200 }),
                    },
                    validations: {
                        hasJwtAuthorization: false,
                        requestQueryParamsSchema: Joi.object({
                            status: Joi.string().valid('active', 'expired').required(),
                        }),
                    },
                },
            ],
        };

        const result = generateApiDefinition(config, appFunctions, '1.0.0');

        expect(result).toMatchSnapshot();
    });

    test('generate api definition for http endpoint with request and response body validation', () => {
        const appFunctions: AppFunctions = {
            httpFunctions: [
                {
                    name: 'http-post-person',
                    options: {
                        authLevel: 'anonymous',
                        methods: ['POST'],
                        route: 'person',
                        handler: async (req) => {
                            const requestBody = (await req.clone().json()) as {
                                name: string;
                            };
                            return { status: 200, jsonBody: { name: requestBody.name } };
                        },
                    },
                    validations: {
                        hasJwtAuthorization: true,
                        requestBodySchema: Joi.object({
                            name: Joi.string().required(),
                        }),
                        responseBodySchema: {
                            200: Joi.object({
                                name: Joi.string().required(),
                            }),
                        },
                    },
                },
            ],
        };

        const result = generateApiDefinition(config, appFunctions, '1.0.0');

        expect(result).toMatchSnapshot();
    });

    test('generate api definition for http endpoint with request and response body validation but exclude request and response body by config', () => {
        const appFunctions: AppFunctions = {
            httpFunctions: [
                {
                    name: 'http-put-person',
                    options: {
                        authLevel: 'anonymous',
                        methods: ['PUT'],
                        route: 'person',
                        handler: async (req) => {
                            const requestBody = (await req.clone().json()) as {
                                name: string;
                            };
                            return { status: 200, jsonBody: { name: requestBody.name } };
                        },
                    },
                    validations: {
                        hasJwtAuthorization: true,
                        requestBodySchema: Joi.object({
                            name: Joi.string().required(),
                        }),
                        responseBodySchema: {
                            200: Joi.object({
                                name: Joi.string().required(),
                                age: Joi.number().optional(),
                            }),
                        },
                    },
                },
            ],
        };

        const result = generateApiDefinition(
            { ...config, excludeRequestBody: true, excludeResponseBody: true },
            appFunctions,
            '1.0.0',
        );

        expect(result).toMatchSnapshot();
    });
});
