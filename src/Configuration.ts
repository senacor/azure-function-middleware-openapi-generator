import { OpenAPIV3 } from 'openapi-types';
import Joi from 'joi';

export type Configuration = {
    apiDefinitions: ApiDefinitionConfiguration[];
};

export type ApiDefinitionConfiguration = {
    title: string;
    description?: string;
    servers?: OpenAPIV3.ServerObject[];
    outputFile: string;
    functionNameRegexToInclude?: string[];
    functionNameRegexToExclude?: string[];
};

const serverJoiSchema = Joi.object<OpenAPIV3.ServerObject>({
    url: Joi.string().required(),
    description: Joi.string().optional(),
    variables: Joi.object().pattern(
        Joi.string(),
        Joi.object<OpenAPIV3.ServerVariableObject>({
            enum: Joi.array().items(Joi.string()).optional(),
            default: Joi.string().required(),
            description: Joi.string().optional(),
        }).optional(),
    ),
});

const apiDefinitionConfigurationJoiSchema = Joi.object<ApiDefinitionConfiguration>({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    servers: Joi.array().items(serverJoiSchema).optional(),
    outputFile: Joi.string()
        .pattern(/^.*((.yaml)|(.json))$/)
        .required(),
    functionNameRegexToInclude: Joi.array().items(Joi.string()).optional(),
    functionNameRegexToExclude: Joi.array().items(Joi.string()).optional(),
});

export const configurationJoiSchema = Joi.object<Configuration>({
    apiDefinitions: Joi.array().items(apiDefinitionConfigurationJoiSchema).required(),
});
