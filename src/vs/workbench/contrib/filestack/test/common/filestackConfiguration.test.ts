/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { FilestackConfigurationService } from '../../common/filestackConfiguration.js';
import { FilestackErrorType } from '../../common/filestackTypes.js';

suite('FilestackConfigurationService', () => {
	let service: FilestackConfigurationService;

	setup(() => {
		service = new FilestackConfigurationService();
	});

	test('should parse valid configuration', () => {
		const configJson = JSON.stringify({
			title: 'Test Stack',
			files: ['file1.ts', 'file2.js']
		});

		const result = service.parseConfiguration(configJson, '/workspace');
		
		assert.ok('title' in result && !('type' in result));
		if ('title' in result) {
			assert.strictEqual(result.title, 'Test Stack');
			assert.strictEqual(result.files.length, 2);
			assert.strictEqual(result.files[0], '/workspace/file1.ts');
			assert.strictEqual(result.files[1], '/workspace/file2.js');
		}
	});

	test('should handle missing title', () => {
		const configJson = JSON.stringify({
			files: ['file1.ts']
		});

		const result = service.parseConfiguration(configJson, '/workspace');
		
		assert.ok('type' in result);
		assert.strictEqual(result.type, FilestackErrorType.INVALID_CONFIGURATION);
		assert.ok(result.message.includes('title'));
	});

	test('should handle missing files array', () => {
		const configJson = JSON.stringify({
			title: 'Test Stack'
		});

		const result = service.parseConfiguration(configJson, '/workspace');
		
		assert.ok('type' in result);
		assert.strictEqual(result.type, FilestackErrorType.INVALID_CONFIGURATION);
		assert.ok(result.message.includes('files'));
	});

	test('should handle empty files array', () => {
		const configJson = JSON.stringify({
			title: 'Test Stack',
			files: []
		});

		const result = service.parseConfiguration(configJson, '/workspace');
		
		assert.ok('type' in result);
		assert.strictEqual(result.type, FilestackErrorType.INVALID_CONFIGURATION);
		assert.ok(result.message.includes('at least one file'));
	});

	test('should handle too many files', () => {
		const files = Array.from({ length: 51 }, (_, i) => `file${i}.ts`);
		const configJson = JSON.stringify({
			title: 'Test Stack',
			files
		});

		const result = service.parseConfiguration(configJson, '/workspace');
		
		assert.ok('type' in result);
		assert.strictEqual(result.type, FilestackErrorType.INVALID_CONFIGURATION);
		assert.ok(result.message.includes('50'));
	});

	test('should handle invalid JSON', () => {
		const configJson = '{ invalid json }';

		const result = service.parseConfiguration(configJson, '/workspace');
		
		assert.ok('type' in result);
		assert.strictEqual(result.type, FilestackErrorType.INVALID_CONFIGURATION);
		assert.ok(result.message.includes('Invalid JSON'));
	});

	test('should resolve absolute paths', () => {
		const path = service.resolveFilePath('/absolute/path/file.ts', '/workspace');
		assert.strictEqual(path, '/absolute/path/file.ts');
	});

	test('should resolve relative paths', () => {
		const path = service.resolveFilePath('./relative/file.ts', '/workspace');
		assert.strictEqual(path, '/workspace/relative/file.ts');
	});

	test('should resolve parent directory paths', () => {
		const path = service.resolveFilePath('../parent/file.ts', '/workspace');
		assert.strictEqual(path, '/workspace/../parent/file.ts');
	});

	test('should resolve workspace-relative paths', () => {
		const path = service.resolveFilePath('src/file.ts', '/workspace');
		assert.strictEqual(path, '/workspace/src/file.ts');
	});

	test('should identify supported file types', () => {
		assert.ok(service.isSupportedFileType('file.ts'));
		assert.ok(service.isSupportedFileType('file.js'));
		assert.ok(service.isSupportedFileType('file.json'));
		assert.ok(service.isSupportedFileType('file.md'));
		assert.ok(service.isSupportedFileType('file.html'));
		assert.ok(service.isSupportedFileType('file.css'));
	});

	test('should identify unsupported file types', () => {
		assert.ok(!service.isSupportedFileType('file.txt'));
		assert.ok(!service.isSupportedFileType('file.bin'));
		assert.ok(!service.isSupportedFileType('file'));
		assert.ok(!service.isSupportedFileType(''));
	});

	test('should validate configuration structure', () => {
		const config = {
			title: 'Test Stack',
			files: ['file1.ts', 'file2.js', 'file3.txt']
		};

		const errors = service.validateConfigurationStructure(config);
		
		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].type, FilestackErrorType.UNSUPPORTED_FILE_TYPE);
		assert.strictEqual(errors[0].filePath, 'file3.txt');
	});

	test('should detect duplicate files', () => {
		const config = {
			title: 'Test Stack',
			files: ['file1.ts', 'file2.js', 'file1.ts']
		};

		const errors = service.validateConfigurationStructure(config);
		
		assert.strictEqual(errors.length, 1);
		assert.strictEqual(errors[0].type, FilestackErrorType.INVALID_CONFIGURATION);
		assert.ok(errors[0].message.includes('duplicate'));
	});

	test('should handle non-string file paths', () => {
		const configJson = JSON.stringify({
			title: 'Test Stack',
			files: ['file1.ts', 123, 'file2.js']
		});

		const result = service.parseConfiguration(configJson, '/workspace');
		
		assert.ok('type' in result);
		assert.strictEqual(result.type, FilestackErrorType.INVALID_CONFIGURATION);
		assert.ok(result.message.includes('strings'));
	});
}); 