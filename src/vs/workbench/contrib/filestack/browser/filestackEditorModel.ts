/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from 'vs/base/common/event';
import { FilestackConfiguration, FilestackFile, FilestackEditorState, Position, FilestackError } from '../common/filestackTypes.js';
import { FilestackConfigurationService } from '../common/filestackConfiguration.js';

/**
 * Model for the FileStack editor that manages file state and operations
 */
export class FilestackEditorModel {
	private readonly _onDidChangeState = new Emitter<FilestackEditorState>();
	public readonly onDidChangeState = this._onDidChangeState.event;

	private _state: FilestackEditorState;
	private _configurationService: FilestackConfigurationService;

	constructor(configuration: FilestackConfiguration) {
		this._configurationService = new FilestackConfigurationService();
		this._state = {
			configuration,
			files: [],
			activeFileIndex: 0,
			scrollPosition: 0
		};
	}

	/**
	 * Get the current editor state
	 */
	public getState(): FilestackEditorState {
		return { ...this._state };
	}

	/**
	 * Load all files in the configuration
	 */
	public async loadFiles(): Promise<FilestackError[]> {
		const errors: FilestackError[] = [];
		const files: FilestackFile[] = [];

		for (let i = 0; i < this._state.configuration.files.length; i++) {
			const filePath = this._state.configuration.files[i];
			
			try {
				// For now, we'll create placeholder content
				// In the real implementation, this would read from the file system
				const content = `// File: ${filePath}\n// Content will be loaded from file system\n`;
				
				files.push({
					path: filePath,
					content,
					isDirty: false,
					languageId: this.getLanguageIdFromPath(filePath)
				});
			} catch (error) {
				errors.push({
					type: 'FILE_READ_ERROR' as any,
					message: `Failed to load file: ${filePath}`,
					filePath,
					originalError: error instanceof Error ? error : new Error(String(error))
				});
			}
		}

		this._state.files = files;
		this._notifyStateChange();
		
		return errors;
	}

	/**
	 * Update cursor position for the active file
	 */
	public updateCursorPosition(position: Position): void {
		if (this._state.activeFileIndex >= 0 && this._state.activeFileIndex < this._state.files.length) {
			this._state.files[this._state.activeFileIndex].cursorPosition = position;
			this._notifyStateChange();
		}
	}

	/**
	 * Navigate to a different file in the stack
	 */
	public navigateToFile(fileIndex: number): boolean {
		if (fileIndex >= 0 && fileIndex < this._state.files.length) {
			this._state.activeFileIndex = fileIndex;
			this._notifyStateChange();
			return true;
		}
		return false;
	}

	/**
	 * Navigate to the next file
	 */
	public navigateToNextFile(): boolean {
		return this.navigateToFile(this._state.activeFileIndex + 1);
	}

	/**
	 * Navigate to the previous file
	 */
	public navigateToPreviousFile(): boolean {
		return this.navigateToFile(this._state.activeFileIndex - 1);
	}

	/**
	 * Update file content
	 */
	public updateFileContent(fileIndex: number, content: string): boolean {
		if (fileIndex >= 0 && fileIndex < this._state.files.length) {
			this._state.files[fileIndex].content = content;
			this._state.files[fileIndex].isDirty = true;
			this._notifyStateChange();
			return true;
		}
		return false;
	}

	/**
	 * Save a specific file
	 */
	public async saveFile(fileIndex: number): Promise<FilestackError | null> {
		if (fileIndex < 0 || fileIndex >= this._state.files.length) {
			return {
				type: 'FILE_WRITE_ERROR' as any,
				message: 'Invalid file index'
			};
		}

		const file = this._state.files[fileIndex];
		
		try {
			// In the real implementation, this would write to the file system
			// For now, we'll just mark it as not dirty
			file.isDirty = false;
			this._notifyStateChange();
			return null;
		} catch (error) {
			return {
				type: 'FILE_WRITE_ERROR' as any,
				message: `Failed to save file: ${file.path}`,
				filePath: file.path,
				originalError: error instanceof Error ? error : new Error(String(error))
			};
		}
	}

	/**
	 * Save all files
	 */
	public async saveAllFiles(): Promise<FilestackError[]> {
		const errors: FilestackError[] = [];

		for (let i = 0; i < this._state.files.length; i++) {
			if (this._state.files[i].isDirty) {
				const error = await this.saveFile(i);
				if (error) {
					errors.push(error);
				}
			}
		}

		return errors;
	}

	/**
	 * Get the currently active file
	 */
	public getActiveFile(): FilestackFile | null {
		if (this._state.activeFileIndex >= 0 && this._state.activeFileIndex < this._state.files.length) {
			return this._state.files[this._state.activeFileIndex];
		}
		return null;
	}

	/**
	 * Get language ID from file path
	 */
	private getLanguageIdFromPath(filePath: string): string {
		const extension = filePath.split('.').pop()?.toLowerCase();
		
		const languageMap: { [key: string]: string } = {
			'ts': 'typescript',
			'js': 'javascript',
			'tsx': 'typescriptreact',
			'jsx': 'javascriptreact',
			'json': 'json',
			'md': 'markdown',
			'html': 'html',
			'css': 'css',
			'scss': 'scss',
			'less': 'less',
			'py': 'python',
			'java': 'java',
			'cpp': 'cpp',
			'c': 'c',
			'h': 'c',
			'cs': 'csharp',
			'php': 'php',
			'rb': 'ruby',
			'go': 'go',
			'rs': 'rust',
			'swift': 'swift',
			'kt': 'kotlin',
			'scala': 'scala',
			'sql': 'sql',
			'xml': 'xml',
			'yaml': 'yaml',
			'yml': 'yaml',
			'toml': 'toml',
			'ini': 'ini',
			'cfg': 'ini',
			'conf': 'ini'
		};

		return languageMap[extension || ''] || 'plaintext';
	}

	/**
	 * Notify listeners of state change
	 */
	private _notifyStateChange(): void {
		this._onDidChangeState.fire(this.getState());
	}

	/**
	 * Dispose the model
	 */
	public dispose(): void {
		this._onDidChangeState.dispose();
	}
} 