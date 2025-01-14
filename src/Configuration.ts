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
