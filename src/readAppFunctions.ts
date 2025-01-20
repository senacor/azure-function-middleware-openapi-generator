import * as azureFunctions from '@azure/functions';
import { HttpFunctionOptions } from '@azure/functions';
import * as azureFunctionMiddleware from '@senacor/azure-function-middleware';
import * as durableFunctions from 'durable-functions';
import { glob } from 'glob';
import { AnySchema } from 'joi';
import path from 'node:path';
import proxyquire from 'proxyquire';

export type AppFunctions = {
    httpFunctions: HttpFunction[];
};

export type HttpFunction = {
    name: string;
    options: HttpFunctionOptions;
    validations: HttpFunctionValidations;
};

export type HttpFunctionValidations = {
    hasJwtAuthorization: boolean;
    requestBodySchema?: AnySchema;
    requestQueryParamsSchema?: AnySchema;
    responseBodySchema?: Record<number, AnySchema>;
};

export function readAppFunctions(functionAppFilesPattern: string): AppFunctions {
    const httpFunctions: HttpFunction[] = [];

    const azureAppMock = {
        http: (name: string, options: HttpFunctionOptions) => {
            console.log(`Found http function ${name}`);
            httpFunctions.push({
                name,
                options,
                validations: extractDataFromMiddleware(options.handler as unknown as MiddlewareFakeResult),
            });
        },
        activity: (name: string) => {
            console.log(`Found activity ${name}`);
        },
        orchestration: (name: string) => {
            console.log(`Found orchestration ${name}`);
        },
        timer: (name: string) => {
            console.log(`Found timer function ${name}`);
        },
        generic: (name: string) => {
            console.log(`Found generic function ${name}`);
        },
    };

    glob.sync(functionAppFilesPattern).forEach((file) => {
        proxyquire(path.resolve(file), {
            '@senacor/azure-function-middleware': {
                ...azureFunctionMiddleware,
                middleware: middlewareFake,
                jwtAuthorization: jwtAuthorizationFake,
                requestBodyValidation: requestBodyValidationFake,
                requestQueryParamsValidation: requestQueryParamsValidationFake,
                responseBodyValidation: responseBodyValidationFake,
            },
            '@azure/functions': {
                ...azureFunctions,
                app: azureAppMock,
            },
            'durable-functions': {
                ...durableFunctions,
                app: durableFunctionsAppFake(),
            },
        });
    });

    return {
        httpFunctions,
    };
}

type MiddlewareFakeResult = {
    beforeExecution: ExecutionFunctionFakeResult[];
    postExecution: ExecutionFunctionFakeResult[];
};

type ExecutionFunctionFakeResult = {
    type: 'jwtAuthorization' | 'requestBodyValidation' | 'requestQueryParamsValidation' | 'responseBodyValidation';
    schema?: AnySchema;
    schemaRecord?: Record<number, AnySchema>;
};

function middlewareFake(
    beforeExecution: ExecutionFunctionFakeResult[],
    handler: unknown,
    postExecution: ExecutionFunctionFakeResult[],
) {
    return {
        beforeExecution,
        postExecution,
    };
}

function jwtAuthorizationFake(): ExecutionFunctionFakeResult {
    return {
        type: 'jwtAuthorization',
    };
}

function requestBodyValidationFake(schema: AnySchema): ExecutionFunctionFakeResult {
    return {
        type: 'requestBodyValidation',
        schema,
    };
}

function requestQueryParamsValidationFake(schema: AnySchema): ExecutionFunctionFakeResult {
    return {
        type: 'requestQueryParamsValidation',
        schema,
    };
}

function responseBodyValidationFake(schemaRecord: Record<number, AnySchema>): ExecutionFunctionFakeResult {
    return {
        type: 'responseBodyValidation',
        schemaRecord,
    };
}

function extractDataFromMiddleware(handler: MiddlewareFakeResult): HttpFunctionValidations {
    return {
        hasJwtAuthorization:
            handler.beforeExecution?.some((f: ExecutionFunctionFakeResult) => f.type === 'jwtAuthorization') ?? false,
        requestBodySchema: handler.beforeExecution?.find(
            (f: ExecutionFunctionFakeResult) => f.type === 'requestBodyValidation',
        )?.schema,
        requestQueryParamsSchema: handler.beforeExecution?.find(
            (f: ExecutionFunctionFakeResult) => f.type === 'requestQueryParamsValidation',
        )?.schema,
        responseBodySchema: handler.postExecution?.find(
            (f: ExecutionFunctionFakeResult) => f.type === 'responseBodyValidation',
        )?.schemaRecord,
    };
}

function durableFunctionsAppFake() {
    return {
        activity: (name: string) => {
            console.log(`Found durable activity ${name}`);
        },
        orchestration: (name: string) => {
            console.log(`Found durable orchestration ${name}`);
        },
    };
}
