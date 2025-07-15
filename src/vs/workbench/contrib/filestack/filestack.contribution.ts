/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Registry } from 'vs/platform/registry/common/platform';
import { Extensions as EditorExtensions, IEditorType } from 'vs/workbench/common/editor';
import { FILESTACK_EDITOR_TYPE, FILESTACK_CONFIG_EXTENSION } from './common/filestackConstants.js';

// Register the FileStack editor type
Registry.as<IEditorType>(EditorExtensions.EditorType).registerEditorType({
	id: FILESTACK_EDITOR_TYPE,
	displayName: 'FileStack Editor',
	// Associate with .filestack.json files
	extensions: [FILESTACK_CONFIG_EXTENSION],
	// This will be implemented in the browser layer
	editorClass: undefined as any
}); 