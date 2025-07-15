/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * FileStack editor type identifier
 */
export const FILESTACK_EDITOR_TYPE = 'filestack.editor';

/**
 * FileStack configuration file extension
 */
export const FILESTACK_CONFIG_EXTENSION = '.filestack.json';

/**
 * FileStack configuration file pattern
 */
export const FILESTACK_CONFIG_PATTERN = '**/*.filestack.json';

/**
 * Default file stack title
 */
export const DEFAULT_FILESTACK_TITLE = 'File Stack';

/**
 * Maximum number of files allowed in a stack
 */
export const MAX_FILES_IN_STACK = 50;

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Supported file extensions for syntax highlighting
 */
export const SUPPORTED_FILE_EXTENSIONS = [
	'.ts', '.js', '.tsx', '.jsx', '.json', '.md', '.html', '.css', '.scss', '.less',
	'.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift',
	'.kt', '.scala', '.sql', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf'
];

/**
 * Command IDs for FileStack
 */
export const FilestackCommands = {
	NAVIGATE_UP: 'filestack.navigateUp',
	NAVIGATE_DOWN: 'filestack.navigateDown',
	SAVE_FILE: 'filestack.saveFile',
	SAVE_ALL: 'filestack.saveAll',
	OPEN_FILESTACK: 'filestack.open'
} as const;

/**
 * Context keys for FileStack
 */
export const FilestackContextKeys = {
	IS_FILESTACK_EDITOR: 'isFilestackEditor',
	HAS_UNSAVED_CHANGES: 'filestackHasUnsavedChanges',
	ACTIVE_FILE_INDEX: 'filestackActiveFileIndex',
	TOTAL_FILES: 'filestackTotalFiles'
} as const;

/**
 * Configuration keys for FileStack
 */
export const FilestackConfigKeys = {
	ENABLE_FILESTACK: 'filestack.enable',
	MAX_FILES: 'filestack.maxFiles',
	MAX_FILE_SIZE: 'filestack.maxFileSize',
	AUTO_SAVE: 'filestack.autoSave'
} as const; 