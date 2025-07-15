/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BaseEditor } from 'vs/workbench/browser/parts/editor/baseEditor';
import { FilestackEditorInput } from './filestackEditorInput.js';
import { FilestackEditorModel } from './filestackEditorModel.js';
import { FilestackEditorWidget } from './filestackEditorWidget.js';
import { FilestackConfigurationService } from '../common/filestackConfiguration.js';
import { IFileService } from 'vs/platform/files/common/files';

/**
 * Main FileStack editor implementation
 */
export class FilestackEditor extends BaseEditor {
	private _widget: FilestackEditorWidget | null = null;
	private _model: FilestackEditorModel | null = null;
	private _configurationService: FilestackConfigurationService;

	constructor(
		@IFileService fileService: IFileService
	) {
		super('filestack.editor', 'FileStack Editor');
		this._configurationService = new FilestackConfigurationService();
	}

	/**
	 * Create the editor widget
	 */
	protected createEditor(parent: HTMLElement): void {
		// The widget will be created when the input is set
	}

	/**
	 * Set the editor input
	 */
	public async setInput(input: FilestackEditorInput): Promise<void> {
		await super.setInput(input);

		// Get the configuration from the input
		const configuration = input.getConfiguration();
		if (!configuration) {
			// Parse the configuration file
			const configUri = input.getConfigurationUri();
			const configContent = await this._loadConfigurationFile(configUri);
			if (configContent) {
				const parsedConfig = this._configurationService.parseConfiguration(
					configContent,
					configUri.fsPath
				);

				if ('title' in parsedConfig) {
					input.setConfiguration(parsedConfig);
					await this._initializeEditor(parsedConfig);
				} else {
					// Handle configuration error
					this._showConfigurationError(parsedConfig);
				}
			}
		} else {
			await this._initializeEditor(configuration);
		}
	}

	/**
	 * Initialize the editor with configuration
	 */
	private async _initializeEditor(configuration: any): Promise<void> {
		// Create the model
		this._model = new FilestackEditorModel(configuration);

		// Create the widget
		const container = this.getContainer();
		this._widget = new FilestackEditorWidget(container, this._model);

		// Set up keyboard navigation
		this._setupKeyboardNavigation();
	}

	/**
	 * Load configuration file content
	 */
	private async _loadConfigurationFile(uri: any): Promise<string | null> {
		try {
			// In the real implementation, this would use the file service
			// For now, return a sample configuration
			return JSON.stringify({
				title: 'Sample FileStack',
				files: [
					'src/file1.ts',
					'src/file2.js',
					'src/file3.json'
				]
			});
		} catch (error) {
			console.error('Failed to load configuration file:', error);
			return null;
		}
	}

	/**
	 * Show configuration error
	 */
	private _showConfigurationError(error: any): void {
		const container = this.getContainer();
		container.innerHTML = `
			<div style="padding: 20px; color: #dc2626;">
				<h3>Configuration Error</h3>
				<p>${error.message}</p>
			</div>
		`;
	}

	/**
	 * Set up keyboard navigation
	 */
	private _setupKeyboardNavigation(): void {
		const container = this.getContainer();
		
		container.addEventListener('keydown', (event) => {
			if (this._widget) {
				this._widget.handleKeyNavigation(event);
			}
		});
	}

	/**
	 * Get the editor input
	 */
	public getInput(): FilestackEditorInput {
		return super.getInput() as FilestackEditorInput;
	}

	/**
	 * Save all files
	 */
	public async saveAll(): Promise<void> {
		if (this._widget) {
			await this._widget.saveAllFiles();
		}
	}

	/**
	 * Get the active file
	 */
	public getActiveFile(): any {
		return this._widget?.getActiveFile() || null;
	}

	/**
	 * Dispose the editor
	 */
	public dispose(): void {
		if (this._widget) {
			this._widget.dispose();
			this._widget = null;
		}
		if (this._model) {
			this._model.dispose();
			this._model = null;
		}
		super.dispose();
	}
} 