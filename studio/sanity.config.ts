import { defineConfig, type WorkspaceOptions } from 'sanity';
import { structureTool } from 'sanity/structure';
import { projectId } from './env';
import { schemaTypes } from './schemaTypes';
import { SINGLETON_TYPES } from './schemaTypes/constants';
import { structure } from './structure';

const singletonTypes = new Set<string>(SINGLETON_TYPES);
/** Sui singleton restano solo le azioni che non creano né eliminano documenti. */
const singletonActions = new Set(['publish', 'discardChanges', 'restore']);

const workspace = (name: string, title: string, dataset: string): WorkspaceOptions => ({
  name,
  title,
  basePath: `/${name}`,
  projectId,
  dataset,
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      singletonTypes.has(schemaType)
        ? actions.filter(({ action }) => action && singletonActions.has(action))
        : actions,
    newDocumentOptions: (items) => items.filter(({ templateId }) => !singletonTypes.has(templateId)),
  },
});

export default defineConfig([
  workspace('production', 'Sito (produzione)', 'production'),
  workspace('staging', 'Prove (staging)', 'staging'),
]);
