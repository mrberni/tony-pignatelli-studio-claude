import { client } from './documents/client';
import { project } from './documents/project';
import { photo } from './objects/photo';
import { seo } from './objects/seo';
import { contactPage } from './singletons/contactPage';
import { homePage } from './singletons/homePage';
import { servicesPage } from './singletons/servicesPage';
import { siteSettings } from './singletons/siteSettings';
import { studioPage } from './singletons/studioPage';

export const schemaTypes = [
  project,
  client,
  homePage,
  studioPage,
  servicesPage,
  contactPage,
  siteSettings,
  seo,
  photo,
];
