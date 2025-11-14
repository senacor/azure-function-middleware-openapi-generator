import fs from 'node:fs';
import { execSync } from 'node:child_process';

describe('azure-function-middleware-openapi-generator', () => {
    beforeAll(() => {
        execSync('cd example && npm run build && npm run generate');
    });

    afterAll(() => {
        execSync('rm -f example/external.yaml example/internal.json example/full_without_body.yaml');
    });

    test('generate open api definition for example project internal api in json format', () => {
        const file = fs.readFileSync('example/internal.json').toString();

        expect(file).toMatchSnapshot();
    });

    test('generate open api definition for example project external api in yaml format', () => {
        const file = fs.readFileSync('example/external.yaml').toString();

        expect(file).toMatchSnapshot();
    });

    test('generate open api definition for example project for all endpoints and excludes request and response body', () => {
        const file = fs.readFileSync('example/full_without_body.yaml').toString();

        expect(file).toMatchSnapshot();
    });
});
