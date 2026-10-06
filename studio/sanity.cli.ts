import { defineCliConfig } from 'sanity/cli';
import { projectId } from './env';

export default defineCliConfig({
  api: { projectId, dataset: 'staging' },
  studioHost: 'tps-claude',
  deployment: { autoUpdates: true, appId: 've24ymmuk7n80a3nxm1oltzv' },
});
