# OpenAPI Generator for Azure Function Middleware

This tool generates an OpenAPI definition for an Azure Function App built with
the [@senacor/azure-function-middleware](https://github.com/senacor/azure-function-middleware).

## Installation

```bash
npm install @senacor/azure-function-middleware-openapi-generator --save-dev
```

## Usage

Create a configuration file `openapi-generation.config.json` in the project's root directory:

```json
{
  "apiDefinitions": [
    {
      "title": "My API",
      "outputFile": "api.yaml"
    }
  ]
}
```

See [chapter configuration](#configuration) for more options.

Run the OpenAPI generator with:

```bash
npx @senacor/azure-function-middleware-openapi-generator
```

## Configuration

The configuration is stored in the file `openapi-generation.config.json`. Every API is described by an `ApiDefinitionConfiguration` object stored in the
`apiDefinitions` array.

Parameters for `ApiDefinitionConfiguration`:

| Name                       | Type                   | Required | Description                                                                   |
|----------------------------|------------------------|----------|-------------------------------------------------------------------------------|
| title                      | string                 | x        | Title of the API definition                                                   |
| description                | string                 |          | Description for the API definition                                            |
| servers                    | ServerObject[]         |          | Details for the server section of the OpenAPI definition                      |
| servers[].url              | string                 | x        |                                                                               |
| servers[].description      | string                 |          |                                                                               |
| servers[].variables        | Record<string, string> |          |                                                                               |
| outputFile                 | string                 | x        | Name of the generated file. Supported file extensions are `.json` and `.yaml` |
| functionNameRegexToInclude | string[]               |          | List of regex patters to include http functions based on their name           |
| functionNameRegexToExclude | string[]               |          | List of regex patters to exclude http functions based on their name           |
| excludeRequestBody         | boolean                |          | Exclude the request body from the generated API definition                    |
| excludeResponseBody        | boolean                |          | Exclude the response body from the generated API definition                   |

Logic to include / exclude http functions:
* If `functionNameRegexToInclude` and `functionNameRegexToExclude` are not specified all functions are used.
* Otherwise:
  * If `functionNameRegexToExclude` is defined and the http function name matches some pattern from `functionNameRegexToExclude`, then the http function will be excluded from the api definition.
  * If `functionNameRegexToInclude` is defined and the http function name matches some pattern from `functionNameRegexToInclude`, then the http function will be included into the api definition.

## Supported Features
* URL path parameters
* URL query parameters if `requestQueryParamsValidation` is used
* Request body schema if `requestBodyValidation` is used
* Response body schema if `responseBodyValidation` is used
* Security schemas for bearer and function key authentication
