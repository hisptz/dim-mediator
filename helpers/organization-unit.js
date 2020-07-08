/***
 *
 */
const chalk = require('chalk');

/***
 *
 */
const axios = require('axios');
const Authentication = require('../auth/system.auth');
const AuthConfig = require('../config/auth.config');
const Logger = require('../logs/logger.log');
const Utilities = require('../utils/utils');

/***
 *
 */
class OrganizationUnitManager {
	/***
	 *
	 */
	constructor() {}

	/***
	 *
	 */
	getOrgUnits = async (
		appGlobalConfig,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		const logger = new Logger();
		if (activeSystem) {
			const dhis = 'https://dhis.moh.go.tz/';
			const orgUnitParam =
				appGlobalConfig &&
				appGlobalConfig[activeSystem][activeBatch][activeJob][
					'isExecuted'
				] &&
				appGlobalConfig[activeSystem][activeBatch][activeJob].ou
					.orgUnits.hasUids
					? appGlobalConfig[activeSystem][activeBatch][
							activeJob
					  ].ou.orgUnits.orgUnitUids
					: appGlobalConfig[activeSystem][activeBatch][
							activeJob
					  ].ou.orgUnits.orgUnitLevel;
			const isUsingLiveDhis2 =
				appGlobalConfig[activeSystem].isUsingLiveDhis2;
			const dataFromURL = isUsingLiveDhis2
				? dhis
				: appGlobalConfig[activeSystem].dataFromURL;
			const sourceSystemName =
				appGlobalConfig[activeSystem].systemInfo.from.name;
			logger.printLogMessageInConsole(
				'default',
				`Organization units loaded from ${chalk.green(
					sourceSystemName.toUpperCase()
				)} system`,
				activeSystem
			);

			return await this.getOrganizationUnitsByCriteria(
				dataFromURL,
				isUsingLiveDhis2,
				activeSystem,
				orgUnitParam
			);
		}
	};

	/***
	 *
	 */
	getOrganizationUnitsByCriteria = async (
		dataFromURL,
		isUsingLiveDhis2,
		activeSystem,
		orgUnitParam
	) => {
		const authenticator = new Authentication();
		const logger = new Logger();
		const utilities = new Utilities();
		let orgunitsURL = ``;

		if (utilities.isArray(orgUnitParam)) {
			orgunitsURL = `${dataFromURL}api/organisationUnits.json?fields=id,name,code&filter=id:in:[${orgUnitParam}]&paging=false`;
		} else {
			orgunitsURL = `${dataFromURL}api/organisationUnits.json?fields=id,name,code&filter=level:eq:${orgUnitParam}&paging=false`;
		}

		if (isUsingLiveDhis2) {
			logger.printLogMessageInConsole(
				'default',
				`${chalk.green(
					chalk.bold(activeSystem.toUpperCase())
				)} is using the DHIS2 Platform ${chalk.blue(
					chalk.bold(dataFromURL)
				)}`,
				activeSystem
			);
			try {
				const orgUnits = await axios.get(
					orgunitsURL,
					authenticator.getSystemAuth(
						AuthConfig,
						activeSystem
					)
				);
				return await orgUnits.data.organisationUnits;
			} catch (error) {
				logger.printLogMessageInConsole(
					'error',
					error,
					activeSystem
				);
			}
		} else {
			logger.printLogMessageInConsole(
				'default',
				`${chalk.green(
					chalk.bold(activeSystem.toUpperCase())
				)} is using the ADDRESS ${chalk.green(orgunitsURL)}`,
				system
			);
		}
	};
}

module.exports = OrganizationUnitManager;
