/***
 *
 */
const _ = require('lodash');
const chalk = require('chalk');

/***
 *
 */
const Logger = require('../../logs/logger.log');

/***
 *
 */
class SystemMapping {
	/***
	 *
	 */
	constructor() {}

	/***
	 *
	 */
	getActiveSystemDXMapping = (
		appGlobalConfig,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 *
		 */
		return appGlobalConfig[activeSystem] &&
			_.has(
				appGlobalConfig[activeSystem][activeBatch][activeJob],
				'mapping'
			) &&
			appGlobalConfig[activeSystem][activeBatch][activeJob].mapping
				.dx.hasMapping
			? appGlobalConfig[activeSystem][activeBatch][activeJob].mapping
					.dx.data
			: {};
	};

	/***
	 *
	 */
	getActiveSystemOrgUnitMapping = (
		appGlobalConfig,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 *
		 */
		return appGlobalConfig[activeSystem] &&
			_.has(
				appGlobalConfig[activeSystem][activeBatch][activeJob],
				'mapping'
			) &&
			appGlobalConfig[activeSystem][activeBatch][activeJob].mapping
				.ou.hasMapping
			? appGlobalConfig[activeSystem][activeBatch][activeJob].mapping
					.ou.orgUnits
			: {};
	};

	/***
	 *
	 */
	getDataElementUid = async (
		appGlobalConfig,
		activeSystem,
		activeBatch,
		activeJob,
		dataElementMapping,
		dataElementUid
	) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		const hasMappingProp = await _.has(
			appGlobalConfig[activeSystem][activeBatch][activeJob],
			'mapping'
		);
		/***
		 *
		 */
		const hasMapping = await appGlobalConfig[activeSystem][activeBatch][
			activeJob
		].mapping.ou.hasMapping;

		/***
		 *
		 */
		if (dataElementMapping && hasMapping) {
			/***
			 *
			 */
			if (_.has(dataElementMapping, dataElementUid)) {
				/***
				 *
				 */
				return dataElementMapping[dataElementUid].to.id;
			} else {
				/***
				 *
				 */
				return dataElementUid;
			}
		} else {
			/***
			 *
			 */
			// TODO: Commented for increasing console message while executing 
			// logger.printLogMessageInConsole(
			// 	'error',
			// 	`No Data Mapping for system ${activeSystem.toUpperCase()}`,
			// 	activeSystem
			// );
			/***
			 *
			 */
			return dataElementUid;
		}
	};

	/***
	 *
	 */
	getOrgUnitUid = async (
		appGlobalConfig,
		activeSystem,
		activeBatch,
		activeJob,
		orgUnitMapping,
		orgUnitId,
		orgUnitObject
	) => {
		/***
		 *
		 */
		const logger = new Logger();
		/***
		 *
		 */
		const hasMappingProp = await _.has(
			appGlobalConfig[activeSystem][activeBatch][activeJob],
			'mapping'
		);
		/***
		 *
		 */
		const hasMapping = await appGlobalConfig[activeSystem][activeBatch][
			activeJob
		].mapping.ou.hasMapping;

		/***
		 *
		 */
		const isCode = await appGlobalConfig[activeSystem][activeBatch][
			activeJob
		].mapping.ou.mappingCriteria.code;

		/***
		 *
		 */
		const isUid = await appGlobalConfig[activeSystem][activeBatch][
			activeJob
		].mapping.ou.mappingCriteria.id;

		/***
		 *
		 */
		if (orgUnitMapping) {
			/***
			 *
			 */
			if (hasMapping) {
				/***
				 *
				 */
				if (hasMappingProp && isCode && !isUid) {
					/***
					 *
					 */
					if (_.has(orgUnitMapping, orgUnitId)) {
						/***
						 *
						 */
						return _.has(
							orgUnitMapping[orgUnitId].to,
							'code'
						)
							? orgUnitMapping[orgUnitId].to.code
							: '';
					} else {
						/***
						 *
						 */
						return orgUnitObject[orgUnitId].code;
					}
				} else if (hasMappingProp && !isCode && isUid) {
					/***
					 *
					 */
					if (_.has(orgUnitMapping, orgUnitId)) {
						/***
						 *
						 */
						return _.has(
							orgUnitMapping[orgUnitId].to,
							'id'
						)
							? orgUnitMapping[orgUnitId].to.id
							: '';
					} else {
						/***
						 *
						 */
						return orgUnitId;
					}
				} else if (hasMappingProp && isUid && isCode) {
					/***
					 *
					 */
					logger.printLogMessageInConsole(
						'error',
						`Data exchange can not use both ${chalk.green(
							chalk.bold(`CODE`.toUpperCase())
						)} and ${chalk.blue(
							chalk.bold(`UID`.toUpperCase())
						)} for ${chalk.blue(
							chalk.bold(`Organisation Unit`)
						)} criteria`,
						activeSystem
					);
					/***
					 *
					 */
					return orgUnitObject[orgUnitId].id;
				} else {
					/***
					 *
					 */
					logger.printLogMessageInConsole(
						'info',
						`UID is used as the criteria for Data Exchange for ${chalk.blue(
							chalk.bold(
								`Organisation Unit Metadata`
							)
						)} - [system ${chalk.green(
							chalk.bold(activeSystem.toUpperCase())
						)}]`,
						activeSystem
					);
					/***
					 *
					 */
					return orgUnitObject[orgUnitId].id;
				}
			} else {
				/***
				 *
				 */
				if (isCode) {
					/***
					 *
					 */
					return orgUnitObject
						? orgUnitObject[orgUnitId].code
						: '';
				} else if (isUid) {
					/***
					 *
					 */
					return orgUnitObject
						? orgUnitObject[orgUnitId].id
						: '';
				} else {
					/***
					 *
					 */
					return orgUnitObject[orgUnitId].id;
				}
			}
		} else {
			/***
			 *
			 */
			logger.printLogMessageInConsole(
				'error',
				`No Organisation Unit Mapping for system ${activeSystem.toUpperCase()}`,
				activeSystem
			);
			/***
			 *
			 */
			return orgUnitObject[orgUnitId].id;
		}
	};
}

module.exports = SystemMapping;
