const _ = require('lodash');

class SystemMapping {
	constructor() {}

	getOrgUnitMappingForCurrentRunningSystem = (
		mediatorConfig,
		systemNameId
	) => {
		return mediatorConfig[systemNameId].isAllowed &&
			_.has(
				mediatorConfig[systemNameId].generic.genericTable.dx,
				'mapping'
			)
			? mediatorConfig[systemNameId].generic.genericTable.dx.mapping.ou
			: {};
	};

	getDataMappingForCurrentRunningSystem = (mediatorConfig, systemNameId) => {
		return mediatorConfig[systemNameId].isAllowed &&
			_.has(
				mediatorConfig[systemNameId].generic.genericTable.dx,
				'mapping'
			)
			? mediatorConfig[systemNameId].generic.genericTable.dx.mapping.dx
			: {};
	};
}

module.exports = SystemMapping;
