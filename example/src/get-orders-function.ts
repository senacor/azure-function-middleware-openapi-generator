import { app, HttpRequest, InvocationContext } from '@azure/functions';
import {
    AppInsightForHttpTrigger,
    headerAuthentication,
    jwtAuthorization,
    middleware,
    requestQueryParamsValidation,
    responseBodyValidation,
} from '@senacor/azure-function-middleware';
import Joi from 'joi';

export const httpHandler = async (request: HttpRequest, context: InvocationContext) => {
    const queryParams = Object.fromEntries(request.query);

    context.info(`Get orders for customer ${request.params.customerId} and status ${queryParams.status}`);

    if (request.params.customerId === 'not-found') {
        return {
            status: 404,
            jsonBody: {
                details: `No orders found for customer ${request.params.customerId}`,
            },
        };
    }

    return {
        status: 200,
        jsonBody: [
            {
                id: '15df9f1c-10f9-4ce1-be38-61d7b4ea7d61',
                status: 'active',
                items: [
                    {
                        id: '7bf0cbc9-b8da-49fe-becc-c41f78f72b5c',
                        name: 'Salad',
                        price: 1.29,
                    },
                    {
                        id: 'b9aa01de-a711-4b6d-8e6a-7da22adacfab',
                        name: 'Tomato',
                        price: 3.99,
                    },
                ],
            },
        ],
    };
};

const queryParamsSchema = Joi.object({
    status: Joi.string().valid('active', 'finished').optional(),
});

const responseSchemas = {
    200: Joi.array().items(
        Joi.object({
            id: Joi.string().uuid().required(),
            status: Joi.string().valid('active', 'finished').required(),
            items: Joi.array()
                .items(
                    Joi.object({
                        id: Joi.string().uuid().required(),
                        name: Joi.string().required(),
                        price: Joi.number().required(),
                    }),
                )
                .min(1)
                .required(),
        }),
    ),
    404: Joi.object({
        details: Joi.string().required(),
    }),
};

export const handler = middleware(
    [
        AppInsightForHttpTrigger.setup,
        headerAuthentication(),
        jwtAuthorization([
            {
                parameterExtractor: (parameters) => parameters.customerId,
                jwtExtractor: (jwt: { sub: string }) => jwt.sub,
            },
        ]),
        requestQueryParamsValidation(queryParamsSchema),
    ],
    httpHandler,
    [responseBodyValidation(responseSchemas), AppInsightForHttpTrigger.finalize],
);

app.http('http-get-orders-for-customer', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'customer/{customerId}/order',
    handler,
});
