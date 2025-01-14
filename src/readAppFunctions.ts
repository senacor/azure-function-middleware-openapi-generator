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
                validations: extractDataFromMiddleware(options.handler as unknown as MiddlewareMock),
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
                middleware: middlewareMock,
                jwtAuthorization: jwtAuthorizationMock,
                requestBodyValidation: requestBodyValidationMock,
                requestQueryParamsValidation: requestQueryParamsValidationMock,
                responseBodyValidation: responseBodyValidationMock,
            },
            '@azure/functions': {
                ...azureFunctions,
                app: azureAppMock,
            },
            'durable-functions': {
                ...durableFunctions,
                app: durableFunctionsAppMock(),
            },
        });
    });

    return {
        httpFunctions,
    };
}

type MiddlewareMock = {
    beforeExecution: ExecutionFunctionMock[];
    postExecution: ExecutionFunctionMock[];
};

type ExecutionFunctionMock = {
    type: 'jwtAuthorization' | 'requestBodyValidation' | 'requestQueryParamsValidation' | 'responseBodyValidation';
    schema?: AnySchema;
    schemaRecord?: Record<number, AnySchema>;
};

function middlewareMock(
    beforeExecution: ExecutionFunctionMock[],
    handler: unknown,
    postExecution: ExecutionFunctionMock[],
) {
    return {
        beforeExecution,
        postExecution,
    };
}

function jwtAuthorizationMock(): ExecutionFunctionMock {
    return {
        type: 'jwtAuthorization',
    };
}

function requestBodyValidationMock(schema: AnySchema): ExecutionFunctionMock {
    return {
        type: 'requestBodyValidation',
        schema,
    };
}

function requestQueryParamsValidationMock(schema: AnySchema): ExecutionFunctionMock {
    return {
        type: 'requestQueryParamsValidation',
        schema,
    };
}

function responseBodyValidationMock(schemaRecord: Record<number, AnySchema>): ExecutionFunctionMock {
    return {
        type: 'responseBodyValidation',
        schemaRecord,
    };
}

function extractDataFromMiddleware(handler: MiddlewareMock): HttpFunctionValidations {
    return {
        hasJwtAuthorization:
            handler.beforeExecution?.some((f: ExecutionFunctionMock) => f.type === 'jwtAuthorization') ?? false,
        requestBodySchema: handler.beforeExecution?.find(
            (f: ExecutionFunctionMock) => f.type === 'requestBodyValidation',
        )?.schema,
        requestQueryParamsSchema: handler.beforeExecution?.find(
            (f: ExecutionFunctionMock) => f.type === 'requestQueryParamsValidation',
        )?.schema,
        responseBodySchema: handler.postExecution?.find(
            (f: ExecutionFunctionMock) => f.type === 'responseBodyValidation',
        )?.schemaRecord,
    };
}

function durableFunctionsAppMock() {
    return {
        activity: (name: string) => {
            console.log(`Found durable activity ${name}`);
        },
        orchestration: (name: string) => {
            console.log(`Found durable orchestration ${name}`);
        },
    };
}
