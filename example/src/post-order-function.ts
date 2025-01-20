import { app, HttpRequest, InvocationContext } from '@azure/functions';
import {
    AppInsightForHttpTrigger,
    headerAuthentication,
    jwtAuthorization,
    middleware,
    requestBodyValidation,
    responseBodyValidation,
} from '@senacor/azure-function-middleware';
import Joi from 'joi';

export const httpHandler = async (request: HttpRequest, context: InvocationContext) => {
    context.info(`Create order for customer ${request.params.customerId}`);

    return { status: 201 };
};

const requestBodySchema = Joi.object({
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
});

const responseSchemas = {
    201: Joi.object({}),
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
        requestBodyValidation(requestBodySchema),
    ],
    httpHandler,
    [responseBodyValidation(responseSchemas), AppInsightForHttpTrigger.finalize],
);

app.http('http-post-order-for-customer', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'customer/{customerId}/order',
    handler,
});
