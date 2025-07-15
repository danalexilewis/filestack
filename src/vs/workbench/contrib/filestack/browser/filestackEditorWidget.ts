/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from 'vs/base/common/lifecycle';
import { FilestackEditorModel } from './filestackEditorModel.js';
import { FilestackFile, Position } from '../common/filestackTypes.js';

/**
 * Widget for the FileStack editor that renders the stacked file view
 */
export class FilestackEditorWidget extends Disposable {
	private _model: FilestackEditorModel;
	private _container: HTMLElement;
	private _fileContainers: HTMLElement[] = [];
	private _editors: any[] = []; // Monaco editors

	constructor(container: HTMLElement, model: FilestackEditorModel) {
		super();
		this._container = container;
		this._model = model;

		// Listen to model state changes
		this._register(this._model.onDidChangeState(() => {
			this._updateView();
		}));

		// Initialize the view
		this._createView();
	}

	/**
	 * Create the initial view structure
	 */
	private _createView(): void {
		// Clear existing content
		this._container.innerHTML = '';
		this._fileContainers = [];
		this._editors = [];

		// Create main container with vertical layout
		const mainContainer = document.createElement('div');
		mainContainer.className = 'filestack-editor-container';
		mainContainer.style.cssText = `
			display: flex;
			flex-direction: column;
			height: 100%;
			overflow-y: auto;
		`;

		this._container.appendChild(mainContainer);

		// Load files and create file sections
		this._model.loadFiles().then(errors => {
			if (errors.length > 0) {
				this._showErrors(errors);
			}
			this._updateView();
		});
	}

	/**
	 * Update the view based on current model state
	 */
	private _updateView(): void {
		const state = this._model.getState();
		const mainContainer = this._container.querySelector('.filestack-editor-container') as HTMLElement;
		
		if (!mainContainer) return;

		// Clear existing file containers
		mainContainer.innerHTML = '';
		this._fileContainers = [];

		// Create file sections
		state.files.forEach((file, index) => {
			const fileContainer = this._createFileSection(file, index);
			mainContainer.appendChild(fileContainer);
			this._fileContainers.push(fileContainer);
		});

		// Highlight active file
		if (state.activeFileIndex >= 0 && state.activeFileIndex < this._fileContainers.length) {
			this._fileContainers[state.activeFileIndex].classList.add('active');
		}
	}

	/**
	 * Create a file section with header and editor
	 */
	private _createFileSection(file: FilestackFile, index: number): HTMLElement {
		const fileContainer = document.createElement('div');
		fileContainer.className = 'filestack-file-section';
		fileContainer.style.cssText = `
			border: 1px solid #e1e4e8;
			margin-bottom: 8px;
			border-radius: 6px;
			overflow: hidden;
		`;

		// Create file header
		const header = this._createFileHeader(file, index);
		fileContainer.appendChild(header);

		// Create editor container
		const editorContainer = document.createElement('div');
		editorContainer.className = 'filestack-editor-container';
		editorContainer.style.cssText = `
			height: 200px;
			min-height: 200px;
			background: #f6f8fa;
		`;

		// Create placeholder editor content
		const editorContent = document.createElement('div');
		editorContent.className = 'filestack-editor-content';
		editorContent.style.cssText = `
			padding: 12px;
			font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
			font-size: 13px;
			line-height: 1.5;
			white-space: pre-wrap;
			color: #24292e;
			background: #ffffff;
			border: none;
			outline: none;
			resize: vertical;
			min-height: 200px;
			height: 100%;
		`;
		editorContent.contentEditable = 'true';
		editorContent.textContent = file.content;

		// Handle content changes
		editorContent.addEventListener('input', () => {
			this._model.updateFileContent(index, editorContent.textContent || '');
		});

		// Handle focus to update active file
		editorContent.addEventListener('focus', () => {
			this._model.navigateToFile(index);
		});

		editorContainer.appendChild(editorContent);
		fileContainer.appendChild(editorContainer);

		return fileContainer;
	}

	/**
	 * Create file header with name and save button
	 */
	private _createFileHeader(file: FilestackFile, index: number): HTMLElement {
		const header = document.createElement('div');
		header.className = 'filestack-file-header';
		header.style.cssText = `
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 12px;
			background: #f6f8fa;
			border-bottom: 1px solid #e1e4e8;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			font-size: 12px;
			font-weight: 600;
		`;

		// File name
		const fileName = document.createElement('span');
		fileName.textContent = this._getFileName(file.path);
		fileName.style.cssText = `
			color: #24292e;
			flex: 1;
		`;

		// Save button
		const saveButton = document.createElement('button');
		saveButton.textContent = file.isDirty ? 'Save*' : 'Save';
		saveButton.style.cssText = `
			background: #2ea44f;
			color: white;
			border: 1px solid #2ea44f;
			border-radius: 6px;
			padding: 4px 12px;
			font-size: 12px;
			cursor: pointer;
			margin-left: 8px;
		`;

		saveButton.addEventListener('click', async () => {
			const error = await this._model.saveFile(index);
			if (error) {
				console.error('Save error:', error);
			}
		});

		header.appendChild(fileName);
		header.appendChild(saveButton);

		return header;
	}

	/**
	 * Get file name from path
	 */
	private _getFileName(path: string): string {
		return path.split('/').pop() || path;
	}

	/**
	 * Show errors in the view
	 */
	private _showErrors(errors: any[]): void {
		const errorContainer = document.createElement('div');
		errorContainer.className = 'filestack-error-container';
		errorContainer.style.cssText = `
			padding: 12px;
			margin: 8px;
			background: #fef2f2;
			border: 1px solid #fecaca;
			border-radius: 6px;
			color: #dc2626;
		`;

		const errorTitle = document.createElement('div');
		errorTitle.textContent = 'Errors loading files:';
		errorTitle.style.cssText = 'font-weight: 600; margin-bottom: 8px;';

		errorContainer.appendChild(errorTitle);

		errors.forEach(error => {
			const errorItem = document.createElement('div');
			errorItem.textContent = error.message;
			errorItem.style.cssText = 'margin-bottom: 4px; font-size: 12px;';
			errorContainer.appendChild(errorItem);
		});

		this._container.appendChild(errorContainer);
	}

	/**
	 * Handle keyboard navigation
	 */
	public handleKeyNavigation(event: KeyboardEvent): boolean {
		switch (event.key) {
			case 'PageUp':
				event.preventDefault();
				return this._model.navigateToPreviousFile();
			case 'PageDown':
				event.preventDefault();
				return this._model.navigateToNextFile();
			default:
				return false;
		}
	}

	/**
	 * Save all files
	 */
	public async saveAllFiles(): Promise<void> {
		const errors = await this._model.saveAllFiles();
		if (errors.length > 0) {
			console.error('Save all errors:', errors);
		}
	}

	/**
	 * Get the active file
	 */
	public getActiveFile(): FilestackFile | null {
		return this._model.getActiveFile();
	}

	/**
	 * Update cursor position
	 */
	public updateCursorPosition(position: Position): void {
		this._model.updateCursorPosition(position);
	}
} 