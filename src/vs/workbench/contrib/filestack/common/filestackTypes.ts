/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Position } from '../../../../editor/common/core/position.js';

/**
 * Configuration for a FileStack view
 */
export interface FilestackConfiguration {
	/** Title of the stack */
	title: string;
	/** Array of file paths to include in the stack */
	files: string[];
}

/**
 * Represents a file in the FileStack
 */
export interface FilestackFile {
	/** File path */
	path: string;
	/** File content */
	content: string;
	/** Whether the file has unsaved changes */
	isDirty: boolean;
	/** Current cursor position in the file */
	cursorPosition?: Position;
	/** Language ID for syntax highlighting */
	languageId?: string;
}

/**
 * State of the FileStack editor
 */
export interface FilestackEditorState {
	/** Configuration for the stack */
	configuration: FilestackConfiguration;
	/** Array of files in the stack */
	files: FilestackFile[];
	/** Index of the currently active file */
	activeFileIndex: number;
	/** Current scroll position */
	scrollPosition: number;
}

/**
 * Error types for FileStack operations
 */
export enum FilestackErrorType {
	/** Configuration file is invalid */
	INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
	/** File not found */
	FILE_NOT_FOUND = 'FILE_NOT_FOUND',
	/** File read error */
	FILE_READ_ERROR = 'FILE_READ_ERROR',
	/** File write error */
	FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
	/** Unsupported file type */
	UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE'
}

/**
 * FileStack error
 */
export interface FilestackError {
	/** Error type */
	type: FilestackErrorType;
	/** Error message */
	message: string;
	/** File path that caused the error (if applicable) */
	filePath?: string;
	/** Original error (if applicable) */
	originalError?: Error;
}

/**
 * Navigation direction for file switching
 */
export enum NavigationDirection {
	UP = 'UP',
	DOWN = 'DOWN'
}

/**
 * Save operation type
 */
export enum SaveOperationType {
	/** Save single file */
	SINGLE_FILE = 'SINGLE_FILE',
	/** Save all files */
	ALL_FILES = 'ALL_FILES'
} 