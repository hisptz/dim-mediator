/***
 *
 */
const _ = require('lodash');
const Utilities = require('../../utils/utils');

/**
 *
 */
class SystemInfo {
	/**
	 *
	 */
	constructor() { }

	/***
	 *
	 */
	getSystemUID = systemName => {
		return systemName
			? _.head(_.reverse(_.split(systemName, '_', 2))).toString()
			: '';
	};

	/**
	 *
	 */
	getActiveSystem = appGlobalConfig => {
		return _.uniq(
			_.filter(_.keys(appGlobalConfig), config => {
				return appGlobalConfig[config].isAllowed;
			})
		);
	};

	getRunningSystem = systems => {
		if (systems) {
			_.forIn(systems, system => { });
		}
	};

	/**
	 *
	 */
	getCurrentRunningBatch = (appGlobalConfig, activeSystem, utilInstance) => {
		return appGlobalConfig
			? _.flattenDeep(
				_.filter(
					_.keys(appGlobalConfig[activeSystem]),
					key => {
						return utilInstance.isObject(
							appGlobalConfig[activeSystem][
							key
							]
						);
					}
				).filter(Boolean)
			)
			: [];
	};

	/**
	 *
	 */
	isUsingHIMMediatorSystem = (appGlobalConfig, activeSystem) => {
		return appGlobalConfig && activeSystem
			? appGlobalConfig[activeSystem].importURL
			: '';
	};

	/**
	 *
	 */
	getActiveSystemImportURL = (appGlobalConfig, activeSystem) => {
		return appGlobalConfig && activeSystem
			? appGlobalConfig[activeSystem].importURL
			: '';
	};

	/**
	 *
	 */
	getCurrentRunningSystemCOC = (appGlobalConfig, activeSystem) => {
		return appGlobalConfig && activeSystem
			? appGlobalConfig[activeSystem].defaultCOC
			: '';
	};

	/**
	 *
	 */
	getDataSetUidForCurrentJob = (
		appGlobalConfig,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 * 
		 */
		return appGlobalConfig && activeSystem
			? appGlobalConfig[activeSystem][activeBatch][activeJob].dataSet
				.id
			: '';
	};

	/**
	 *
	 */
	getCurrentRunningJob = (appGlobalConfig, activeSystem, utilInstance) => {
		return _.flattenDeep(
			_.map(_.keys(appGlobalConfig[activeSystem]), key => {
				return utilInstance.isObject(
					appGlobalConfig[activeSystem][key]
				)
					? _.filter(
						_.keys(
							appGlobalConfig[activeSystem][
							key
							]
						),
						subKey => {
							return (
								utilInstance.isObject(
									appGlobalConfig[
									activeSystem
									][key][subKey]
								) &&
								appGlobalConfig[
								activeSystem
								][key][subKey] &&
								appGlobalConfig[
								activeSystem
								][key][subKey]['execute']
							);
						}
					)
					: [];
			}).filter(Boolean)
		);
	};
}

module.exports = SystemInfo;
