import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
    label: 'unitTests',
    files: ['out/**/*.js', 'src/tests/**/*.txt'],
    version: 'insiders',
    workspaceFolder: './sampleWorkspace',
    mocha: {
        ui: 'tdd',
        timeout: 20000
    }
});
