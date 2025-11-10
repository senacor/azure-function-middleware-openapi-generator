import { ApiDefinitionConfiguration, Configuration } from './Configuration';
import { AppFunctions, HttpFunction } from './readAppFunctions';
import fs from 'node:fs';
import YAML from 'yaml';
import { OpenAPIV3 } from 'openapi-types';
import parse from 'joi-to-json';
import { AnySchema } from 'joi';

export function generateApiDefinitions(
    configuration: Configuration,
    appFunctions: AppFunctions,
    packageVersion: string,
) {
    configuration.apiDefinitions.forEach((config) => {
        const apiDefinition = generateApiDefinition(config, appFunctions, packageVersion);
        writeApiDefinition(config, apiDefinition);
    });
}

export function generateApiDefinition(
    config: ApiDefinitionConfiguration,
    appFunctions: AppFunctions,
    packageVersion: string,
): OpenAPIV3.Document {
    const apiDefinition: OpenAPIV3.Document = {
        openapi: '3.0.2',
        info: {
            version: packageVersion,
            title: config.title,
            description: config.description,
        },
        servers: config.servers,
        paths: {},
        components: {
            securitySchemes: {
                FunctionKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-functions-key',
                },
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    };

    appFunctions.httpFunctions
        .filter((httpFunction) => httpFunction.name && httpFunction.options.route)
        .filter((httpFunction) => shouldIncludeHttpFunctionInApiDefinition(config, httpFunction.name))
        .forEach((httpFunction) => {
            const fullRoute = `/${httpFunction.options.route}`;
            const operationObject: OpenAPIV3.OperationObject = {
                operationId: httpFunction.name,
                parameters: [
                    ...extractParametersFromRoute(fullRoute),
                    ...generateQueryParametersDefinition(httpFunction),
                ],
                requestBody: config.excludeRequestBody
                    ? undefined
                    : joiSchemaToOpenApi(httpFunction.validations.requestBodySchema),
                responses: config.excludeResponseBody
                    ? { default: { description: 'ok' } }
                    : generateResponses(httpFunction),
                security: generateSecurityForHttpFunction(httpFunction),
            };

            (httpFunction.options.methods ?? ['GET', 'POST'])
                .filter((method) => method !== 'CONNECT')
                .map((method) => OpenAPIV3.HttpMethods[method])
                .forEach((method) => {
                    if (!apiDefinition.paths[fullRoute]) {
                        apiDefinition.paths[fullRoute] = {};
                    }

                    apiDefinition.paths[fullRoute][method] = operationObject;
                });
        });

    return apiDefinition;
}

function shouldIncludeHttpFunctionInApiDefinition(config: ApiDefinitionConfiguration, name: string): boolean {
    if (!config.functionNameRegexToExclude && !config.functionNameRegexToInclude) {
        return true;
    }

    if (config.functionNameRegexToExclude?.some((regex) => name.match(regex)) === true) {
        return false;
    }

    return config.functionNameRegexToInclude?.some((regex) => name.match(regex)) === true;
}

function extractParametersFromRoute(route: string): OpenAPIV3.ParameterObject[] {
    return route
        .split('/')
        .filter((routePart) => routePart.startsWith('{') && routePart.endsWith('}'))
        .map((routePart) => {
            return {
                name: routePart.slice(1, routePart.length - 1),
                in: 'path',
                required: true,
                schema: {
                    type: 'string',
                },
            };
        });
}

function joiSchemaToOpenApi(schema?: AnySchema) {
    return schema ? parse(schema) : undefined;
}

function generateSecurityForHttpFunction(httpFunction: HttpFunction): OpenAPIV3.SecurityRequirementObject[] {
    const security = [];

    if (httpFunction.options.authLevel === 'function') {
        security.push({ FunctionKeyAuth: [] });
    }

    if (httpFunction.validations.hasJwtAuthorization) {
        security.push({ BearerAuth: [] });
    }

    return security;
}

function generateQueryParametersDefinition(httpFunction: HttpFunction): OpenAPIV3.ParameterObject[] {
    const queryOpenApiSchema = joiSchemaToOpenApi(httpFunction.validations.requestQueryParamsSchema);

    if (!queryOpenApiSchema) {
        return [];
    }

    if (queryOpenApiSchema.type !== 'object') {
        console.warn(`Request query parameter schema for ${httpFunction.name} is not valid.`);
        return [];
    }

    const queryParams: OpenAPIV3.ParameterObject[] = [];

    Object.entries(queryOpenApiSchema.properties).forEach(([key, value]) => {
        const { description, ...remainingSchema } = value as OpenAPIV3.NonArraySchemaObject;

        queryParams.push({
            name: key,
            in: 'query',
            required: queryOpenApiSchema.required?.includes(key) ?? false,
            description: description,
            schema: remainingSchema,
        });
    });

    return queryParams;
}

function generateResponses(httpFunction: HttpFunction): OpenAPIV3.ResponsesObject {
    if (!httpFunction.validations.responseBodySchema) {
        return {
            default: {
                description: 'ok',
            },
        };
    }

    const responses: OpenAPIV3.ResponsesObject = {};

    if (httpFunction.validations.responseBodySchema) {
        Object.entries(httpFunction.validations.responseBodySchema).forEach(([status, schema]) => {
            responses[status] = {
                description: `${status} response`,
                content: {
                    'application/json': {
                        schema: joiSchemaToOpenApi(schema),
                    },
                },
            };
        });
    }

    return responses;
}

function writeApiDefinition(config: ApiDefinitionConfiguration, apiDefinition: OpenAPIV3.Document) {
    fs.writeFileSync(
        config.outputFile,
        config.outputFile.endsWith('.json') ? JSON.stringify(apiDefinition, null, 2) : YAML.stringify(apiDefinition),
        {
            encoding: 'utf-8',
        },
    );
}
