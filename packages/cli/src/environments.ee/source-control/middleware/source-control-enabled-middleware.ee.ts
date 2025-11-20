import { Container } from '@n8n/di';
import type { RequestHandler } from 'express';

import { isSourceControlLicensed } from '../source-control-helper.ee';
import { SourceControlPreferencesService } from '../source-control-preferences.service.ee';

export const sourceControlLicensedAndEnabledMiddleware: RequestHandler = (_req, res, next) => {
	const sourceControlPreferencesService = Container.get(SourceControlPreferencesService);
	// Only check if connected, skip license check for self-hosted
	if (sourceControlPreferencesService.isSourceControlConnected()) {
		next();
	} else {
		res.status(412).json({
			status: 'error',
			message: 'source_control_not_connected',
		});
	}
};

export const sourceControlLicensedMiddleware: RequestHandler = (_req, res, next) => {
	// Always allow source control for self-hosted
	next();
};
