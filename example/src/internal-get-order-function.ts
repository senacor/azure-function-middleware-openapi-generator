import { app, HttpRequest, InvocationContext } from '@azure/functions';
import { AppInsightForHttpTrigger, middleware, responseBodyValidation } from '@senacor/azure-function-middleware';
import Joi from 'joi';

export const httpHandler = async (request: HttpRequest, context: InvocationContext) => {
    context.info(`Get order ${request.params.orderId}`);

    return {
        status: 200,
        jsonBody: {
            id: request.params.orderId,
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
    };
};

const responseSchemas = {
    200: Joi.object({
        id: Joi.string().uuid().required(),
        status: Joi.string().valid('active', 'finished').required(),
        items: Joi.array().items(
            Joi.object({
                id: Joi.string().uuid().required(),
                name: Joi.string().required(),
                price: Joi.number().required(),
            }),
        ),
    }),
    404: Joi.object({
        details: Joi.string().required(),
    }),
};

export const handler = middleware([AppInsightForHttpTrigger.setup], httpHandler, [
    responseBodyValidation(responseSchemas),
    AppInsightForHttpTrigger.finalize,
]);

app.http('internal-http-get-order', {
    methods: ['GET'],
    authLevel: 'function',
    route: 'order/{orderId}',
    handler,
});
