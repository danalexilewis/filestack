/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { EditorInput } from 'vs/workbench/common/editor/editorInput';
import { URI } from 'vs/base/common/uri';
import { FilestackConfiguration } from '../common/filestackTypes.js';
import { FILESTACK_EDITOR_TYPE } from '../common/filestackConstants.js';

/**
 * Editor input for FileStack files
 */
export class FilestackEditorInput extends EditorInput {
	private _configuration: FilestackConfiguration | null = null;
	private _configurationUri: URI;

	constructor(configurationUri: URI) {
		super();
		this._configurationUri = configurationUri;
	}

	/**
	 * Get the editor type ID
	 */
	public getTypeId(): string {
		return FILESTACK_EDITOR_TYPE;
	}

	/**
	 * Get the editor name (displayed in tabs)
	 */
	public getName(): string {
		return this._configuration?.title || 'FileStack';
	}

	/**
	 * Get the editor description
	 */
	public getDescription(): string | undefined {
		return this._configurationUri.fsPath;
	}

	/**
	 * Get the editor title (displayed in title bar)
	 */
	public getTitle(): string {
		return this.getName();
	}

	/**
	 * Get the configuration URI
	 */
	public getConfigurationUri(): URI {
		return this._configurationUri;
	}

	/**
	 * Set the configuration
	 */
	public setConfiguration(configuration: FilestackConfiguration): void {
		this._configuration = configuration;
	}

	/**
	 * Get the configuration
	 */
	public getConfiguration(): FilestackConfiguration | null {
		return this._configuration;
	}

	/**
	 * Check if this input is dirty (has unsaved changes)
	 */
	public isDirty(): boolean {
		// FileStack configurations are typically not editable directly
		return false;
	}

	/**
	 * Check if this input can be saved
	 */
	public isSaving(): boolean {
		return false;
	}

	/**
	 * Get the resource URI
	 */
	public getResource(): URI | undefined {
		return this._configurationUri;
	}

	/**
	 * Check if this input matches another input
	 */
	public matches(other: EditorInput): boolean {
		if (other instanceof FilestackEditorInput) {
			return this._configurationUri.toString() === other._configurationUri.toString();
		}
		return false;
	}
} 