import { defineCliConfig } from 'sanity/cli';
import { projectId } from './env';

export default defineCliConfig({
  api: { projectId, dataset: 'staging' },
  deployment: { autoUpdates: true },
});
