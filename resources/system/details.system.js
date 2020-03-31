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
	getActiveSystem = mediatorConfig => {
		return _.uniq(
			_.filter(_.keys(mediatorConfig), config => {
				return mediatorConfig[config].isAllowed;
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
	getCurrentRunningBatch = (mediatorConfig, activeSystem, utilInstance) => {
		return mediatorConfig
			? _.flattenDeep(
				_.filter(
					_.keys(mediatorConfig[activeSystem]),
					key => {
						return utilInstance.isObject(
							mediatorConfig[activeSystem][
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
	isUsingHIMMediatorSystem = (mediatorConfig, activeSystem) => {
		return mediatorConfig && activeSystem
			? mediatorConfig[activeSystem].importURL
			: '';
	};

	/**
	 *
	 */
	getActiveSystemImportURL = (mediatorConfig, activeSystem) => {
		return mediatorConfig && activeSystem
			? mediatorConfig[activeSystem].importURL
			: '';
	};

	/**
	 *
	 */
	getCurrentRunningSystemCOC = (mediatorConfig, activeSystem) => {
		return mediatorConfig && activeSystem
			? mediatorConfig[activeSystem].defaultCOC
			: '';
	};

	/**
	 *
	 */
	getDataSetUidForCurrentJob = (
		mediatorConfig,
		activeSystem,
		activeBatch,
		activeJob
	) => {
		/***
		 * 
		 */
		return mediatorConfig && activeSystem
			? mediatorConfig[activeSystem][activeBatch][activeJob].dataSet
				.id
			: '';
	};

	/**
	 *
	 */
	getCurrentRunningJob = (mediatorConfig, activeSystem, utilInstance) => {
		return _.flattenDeep(
			_.map(_.keys(mediatorConfig[activeSystem]), key => {
				return utilInstance.isObject(
					mediatorConfig[activeSystem][key]
				)
					? _.filter(
						_.keys(
							mediatorConfig[activeSystem][
							key
							]
						),
						subKey => {
							return (
								utilInstance.isObject(
									mediatorConfig[
									activeSystem
									][key][subKey]
								) &&
								mediatorConfig[
								activeSystem
								][key][subKey] &&
								mediatorConfig[
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
