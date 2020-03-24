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
        return systemName ? _.head(_.reverse(_.split(systemName, '_', 2))).toString() : '';
    };

    /**
           *
           */
    getCurrentRunningSystem = mediatorConfig => {
        return _.head(
            _.filter(_.keys(mediatorConfig), config => {
                return mediatorConfig[config].isAllowed;
            })
        );
    };

    /**
           *
           */
    getCurrentRunningReport = (mediatorConfig, systemNameId) => {
        const utilities = new Utilities();
        return _.head(
            _.flattenDeep(
                _.filter(_.keys(mediatorConfig[systemNameId]), key => {
                    return utilities.isObject(mediatorConfig[systemNameId][key]);
                }).filter(Boolean)
            )
        );
    };

    /**
           * 
           */
    isUsingHIMMediatorSystem = (mediatorConfig, systemNameId) => {
        return mediatorConfig && systemNameId
            ? mediatorConfig[systemNameId].isUsingHIM
            : '';
    };

    /**
           * 
           */
    getCurrentRunningSystemImportURL = (mediatorConfig, systemNameId) => {
        return mediatorConfig && systemNameId
            ? mediatorConfig[systemNameId].importURL
            : '';
    };

    /**
           * 
           */
    getCurrentRunningSystemCOC = (mediatorConfig, systemNameId) => {
        return mediatorConfig && systemNameId
            ? mediatorConfig[systemNameId].defaultCOC
            : '';
    };

    /**
           *
           */
    getDatasetForCurrentRunningSystem = (mediatorConfig, systemNameId) => {
        const utilities = new Utilities();
        if (systemNameId === 'planrep') {
            return _.head(
                _.flattenDeep(
                    _.keys(mediatorConfig[systemNameId]).map(key => {
                        return utilities.isObject(mediatorConfig[systemNameId][key])
                            ? _.keys(mediatorConfig[systemNameId][key]).map(subkey => {
                                return subkey.startsWith('job') &&
                                    mediatorConfig[systemNameId][key][subkey]['execute']
                                    ? mediatorConfig[systemNameId][key][subkey].dx.dataSet
                                    : null;
                            })
                            : null;
                    })
                ).filter(Boolean)
            );
        } else {
            return systemNameId
                ? mediatorConfig[systemNameId].generic.genericTable.dx.dataSet
                : '';
        }
    };

    /**
           *
           */
    getCurrentRunningTable = (mediatorConfig, systemNameId) => {
        const utilities = new Utilities();
        return _.head(
            _.flattenDeep(
                _.map(_.keys(mediatorConfig[systemNameId]), key => {
                    return utilities.isObject(mediatorConfig[systemNameId][key])
                        ? _.filter(_.keys(mediatorConfig[systemNameId][key]), subKey => {
                            return (
                                utilities.isObject(
                                    mediatorConfig[systemNameId][key][subKey]
                                ) &&
                                mediatorConfig[systemNameId][key][subKey] &&
                                mediatorConfig[systemNameId][key][subKey]['execute']
                            );
                        })
                        : [];
                }).filter(Boolean)
            )
        );
    };
}

module.exports = SystemInfo;
