const axios = require('axios');
const Authentication = require('../auth/system.auth');
const AuthConfig = require('../config/auth.config');
const Logger = require('../logs/logger.log');

class OrganizationUnit {
	constructor() {}

	getOrgunits = async (orgType, dataFromURL, isUsingLiveDhis2, system) => {
		const logger = new Logger();
		if (system === 'ards') {
			logger.printLogMessageInConsole(
				'default',
				'Organization units from ARDS',
				system
			);
			return await this.getCouncilOrganizationUnits(
				dataFromURL,
				isUsingLiveDhis2,
				system
			);
		} else if (system === 'nsmis') {
			logger.printLogMessageInConsole(
				'default',
				'Organization units from NSMIS',
				system
			);
			return await this.getCouncilOrganizationUnits(
				dataFromURL,
				isUsingLiveDhis2,
				system
			);
		} else if (system === 'hmis') {
			logger.printLogMessageInConsole(
				'default',
				'Organization units from DHIS2 HMIS',
				system
			);
			return await this.getCouncilOrganizationUnits(
				dataFromURL,
				isUsingLiveDhis2,
				system
			);
		} else {
			if (orgType === 'council') {
				return await this.getCouncilOrganizationUnits(
					dataFromURL,
					isUsingLiveDhis2,
					system
				);
			} else if (orgType === 'facilities') {
				return await this.getFacilitiesOrganizationUnits(
					dataFromURL,
					isUsingLiveDhis2,
					system
				);
			} else {
				logger.printLogMessageInConsole(
					'default',
					'No organization unit criterial specified i.e facilities or council'
				);
			}
		}
	};

	getFacilitiesOrganizationUnits = async (
		dataFromURL,
		isUsingLiveDhis2,
		system
	) => {
		const authenticator = new Authentication();
		const logger = new Logger();

		// Organisation Unit API with Only Public Facilities
		const orgunitsURL = `${dataFromURL}api/organisationUnits.json?fields=id,name,code&filter=level:eq:4&&filter=organisationUnitGroups.name:eq:Public&paging=false`;

		// Organisation Unit API with All Public And Private Facilities
		// const orgunitsURL = `https://hmisportal.moh.go.tz/dhis/api/organisationUnits.json?fields=id,name,code&filter=level:eq:4&paging=false`;
		try {
			if (isUsingLiveDhis2) {
				const orgUnits = await axios.get(
					orgunitsURL,
					authenticator.getHMISDHIS2SuperAuth()
				);
				return await orgUnits.data.organisationUnits;
			} else {
				const orgUnits = await axios.get(
					orgunitsURL,
					authenticator.getSystemAuth()
				);
				return await orgUnits.data.organisationUnits;
			}
		} catch (error) {
			logger.printLogMessageInConsole('error', error, system);
		}
	};

	getCouncilOrganizationUnits = async (
		dataFromURL,
		isUsingLiveDhis2,
		system
	) => {
		const authenticator = new Authentication();
		const logger = new Logger();

		if (system === 'ards') {
			try {
				const orgunitsURL = `${dataFromURL}api/organisationUnits.json?fields=id,name&filter=level:eq:3&paging=false`;
				const orgUnits = await axios.get(
					orgunitsURL,
					authenticator.getARDSSuperAuth()
				);
				return await orgUnits.data.organisationUnits;
			} catch (error) {
				logger.printLogMessageInConsole('error', error, system);
			}
		} else if (system === 'nsmis') {
			try {
				const orgunitsURL = `${dataFromURL}api/organisationUnits.json?fields=id,name&filter=level:eq:3&paging=false`;
				const orgUnits = await axios.get(
					orgunitsURL,
					authenticator.getNSMISSuperAuth()
				);
				return await orgUnits.data.organisationUnits;
			} catch (error) {
				logger.printLogMessageInConsole('error', error, system);
			}
		} else if (system === 'hmis') {
			if (isUsingLiveDhis2) {
				logger.printLogMessageInConsole(
					'default',
					`IS USING PATH::: ${dataFromURL}`,
					system
				);
				const orgunitsURL = `${dataFromURL}api/organisationUnits.json?fields=id,name,code&filter=level:eq:3&paging=false`;
				try {
					const orgUnits = await axios.get(
						orgunitsURL,
						authenticator.getHMISDHIS2SuperAuth()
					);
					return await orgUnits.data.organisationUnits;
				} catch (error) {
					logger.printLogMessageInConsole('error', error, system);
				}
			}
		} else {
			// Organisation Unit API with Councils
			const orgunitsURL = `${dataFromURL}api/organisationUnits.json?fields=id,name,code&filter=level:eq:3&paging=false`;
			if (isUsingLiveDhis2) {
				logger.printLogMessageInConsole(
					'default',
					`IS USING PATH::: ${dataFromURL}`,
					system
				);
				try {
					const orgUnits = await axios.get(
						orgunitsURL,
						authenticator.getSystemAuth(AuthConfig, system)
					);
					return await orgUnits.data.organisationUnits;
				} catch (error) {
					logger.printLogMessageInConsole('error', error, system);
				}
			} else {
				try {
					const orgUnits = await axios.get(
						orgunitsURL,
						authenticator.getHMISPortalSuperAuth()
					);
					return await orgUnits.data.organisationUnits;
				} catch (error) {
					logger.printLogMessageInConsole('error', error, system);
				}
			}
		}
	};
}

module.exports = OrganizationUnit;
