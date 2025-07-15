/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { FilestackConfiguration, FilestackError, FilestackErrorType } from './filestackTypes.js';
import { MAX_FILES_IN_STACK, SUPPORTED_FILE_EXTENSIONS } from './filestackConstants.js';

/**
 * Service for parsing and validating FileStack configuration files
 */
export class FilestackConfigurationService {
	/**
	 * Parse a FileStack configuration from JSON content
	 */
	public parseConfiguration(content: string, basePath: string): FilestackConfiguration | FilestackError {
		try {
			const config = JSON.parse(content) as any;

			// Validate required fields
			if (!config.title || typeof config.title !== 'string') {
				return {
					type: FilestackErrorType.INVALID_CONFIGURATION,
					message: 'Configuration must have a valid "title" field'
				};
			}

			if (!Array.isArray(config.files)) {
				return {
					type: FilestackErrorType.INVALID_CONFIGURATION,
					message: 'Configuration must have a "files" array'
				};
			}

			if (config.files.length === 0) {
				return {
					type: FilestackErrorType.INVALID_CONFIGURATION,
					message: 'Configuration must have at least one file'
				};
			}

			if (config.files.length > MAX_FILES_IN_STACK) {
				return {
					type: FilestackErrorType.INVALID_CONFIGURATION,
					message: `Configuration cannot have more than ${MAX_FILES_IN_STACK} files`
				};
			}

			// Validate file paths
			const resolvedFiles: string[] = [];
			for (const filePath of config.files) {
				if (typeof filePath !== 'string') {
					return {
						type: FilestackErrorType.INVALID_CONFIGURATION,
						message: 'All file paths must be strings'
					};
				}

				const resolvedPath = this.resolveFilePath(filePath, basePath);
				resolvedFiles.push(resolvedPath);
			}

			return {
				title: config.title,
				files: resolvedFiles
			};
		} catch (error) {
			return {
				type: FilestackErrorType.INVALID_CONFIGURATION,
				message: 'Invalid JSON configuration',
				originalError: error instanceof Error ? error : new Error(String(error))
			};
		}
	}

	/**
	 * Resolve a file path relative to the base path
	 */
	public resolveFilePath(path: string, basePath: string): string {
		// Handle absolute paths
		if (path.startsWith('/')) {
			return path;
		}

		// Handle relative paths (starting with ./ or ../)
		if (path.startsWith('./') || path.startsWith('../')) {
			return this.joinPaths(basePath, path);
		}

		// Handle workspace-relative paths
		return this.joinPaths(basePath, path);
	}

	/**
	 * Join paths in a cross-platform way
	 */
	private joinPaths(basePath: string, relativePath: string): string {
		const separator = '/';
		const base = basePath.endsWith(separator) ? basePath.slice(0, -1) : basePath;
		const relative = relativePath.startsWith(separator) ? relativePath.slice(1) : relativePath;
		return `${base}${separator}${relative}`;
	}

	/**
	 * Validate if a file path is supported
	 */
	public isSupportedFileType(filePath: string): boolean {
		const extension = this.getFileExtension(filePath);
		return SUPPORTED_FILE_EXTENSIONS.includes(extension);
	}

	/**
	 * Get file extension from path
	 */
	private getFileExtension(filePath: string): string {
		const lastDotIndex = filePath.lastIndexOf('.');
		if (lastDotIndex === -1) {
			return '';
		}
		return filePath.substring(lastDotIndex).toLowerCase();
	}

	/**
	 * Validate configuration structure (without file system access)
	 */
	public validateConfigurationStructure(configuration: FilestackConfiguration): FilestackError[] {
		const errors: FilestackError[] = [];

		// Check for duplicate files
		const uniqueFiles = new Set(configuration.files);
		if (uniqueFiles.size !== configuration.files.length) {
			errors.push({
				type: FilestackErrorType.INVALID_CONFIGURATION,
				message: 'Configuration contains duplicate file paths'
			});
		}

		// Check file types
		for (const filePath of configuration.files) {
			if (!this.isSupportedFileType(filePath)) {
				errors.push({
					type: FilestackErrorType.UNSUPPORTED_FILE_TYPE,
					message: `Unsupported file type: ${filePath}`,
					filePath
				});
			}
		}

		return errors;
	}
} 