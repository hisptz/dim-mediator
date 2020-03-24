const axios = require('axios');
const Logger = require('../logs/logger.log');
const Authenticate = require('../auth/system.auth');
const Utilities = require('../utils/utils');
const AuthConfig = require('../config/auth.config');

class MediatorService {
	APIURLS = [];

	constructor() {}

	generateAnalyticsURL = (ou, dx, pe, systemURL, system) => {
		const utilities = new Utilities();
		const authenticator = new Authenticate();
		const hostname = `https://${authenticator.getAuthCred()}hmisportal.moh.go.tz/dhis`;
		const api = `api/analytics.json`;
		const dataDime = `dimension=dx:${dx}`;
		const categoryOptionComboDimension = `dimension=co`;
		const periodDime = `filter=pe:${pe}`;
		const orgunitDime = `dimension=ou:${ou}`;
		const props = `displayProperty=NAME&skipMeta=false`;
		const APIUrl = `${hostname}/${api}?${dataDime}&${categoryOptionComboDimension}&${periodDime}&${orgunitDime}&${props}`;
		return APIUrl;
	};

	generateGenericAnalyticsURLForSystems = (ou, dx, pe, systemURL, system) => {
		const utilities = new Utilities();
		if (system === 'ards') {
			const authenticator = new Authenticate();
			const hostname = `https://${authenticator.getARDSAuthCred()}${utilities.URLSanitizer(
				systemURL
			)}`;
			const api = `api/analytics.json`;
			const dataDime = `dimension=dx:${dx}`;
			const categoryOptionComboDimension = `dimension=co`;
			const periodDime = `filter=pe:${pe}`;
			const orgunitDime = `dimension=ou:${ou}`;
			const props = `displayProperty=NAME&skipMeta=false`;
			const APIUrl = `${hostname}/${api}?${dataDime}&${periodDime}&${orgunitDime}&${props}`;
			return APIUrl;
		} else if (system === 'nsmis') {
			const authenticator = new Authenticate();
			const hostname = `https://${authenticator.getNSMISAuthCred()}${utilities.URLSanitizer(
				systemURL
			)}`;
			const api = `api/analytics.json`;
			const dataDime = `dimension=dx:${dx}`;
			const categoryOptionComboDimension = `dimension=co`;
			const periodDime = `filter=pe:${pe}`;
			const orgunitDime = `dimension=ou:${ou}`;
			const props = `displayProperty=NAME&skipMeta=false`;
			const APIUrl = `${hostname}/${api}?${dataDime}&${periodDime}&${orgunitDime}&${props}`;
			return APIUrl;
		} else if (system === 'hmis') {
			const authenticator = new Authenticate();
			const hostname = `https://${authenticator.getDHIS2HMISAuthCred()}${utilities.URLSanitizer(
				systemURL
			)}`;
			const api = `api/analytics.json`;
			const dataDime = `dimension=dx:${dx}`;
			const categoryOptionComboDimension = `dimension=co`;
			const periodDime = `filter=pe:${pe}`;
			const orgunitDime = `dimension=ou:${ou}`;
			const props = `displayProperty=NAME&skipMeta=false`;
			const APIUrl = `${hostname}${api}?${dataDime}&${periodDime}&${orgunitDime}&${props}`;
			return APIUrl;
		} else if (system === 'wisnpoa') {
			const authenticator = new Authenticate();
			const hostname = `https://${authenticator.getDHIS2HMISAuthCred()}${utilities.URLSanitizer(
				systemURL
			)}`;			
			const api = `api/analytics.json`;
			const dataDime = `dimension=dx:${dx}`;
			const categoryOptionComboDimension = `dimension=co`;
			const periodDime = `filter=pe:${pe}`;
			const orgunitDime = `dimension=ou:${ou}`;
			const props = `displayProperty=NAME&skipMeta=false`;
			const APIUrl = `${hostname}/${api}?${dataDime}&${categoryOptionComboDimension}&${periodDime}&${orgunitDime}&${props}`;
			return APIUrl;
		} else if (system === 'planrep') {
			const authenticator = new Authenticate();
			const hostname = `https://${authenticator.getSystemAuthForAPICall(AuthConfig, system)}${utilities.URLSanitizer(
				systemURL
			)}`;			
			const api = `api/analytics.json`;
			const dataDime = `dimension=dx:${dx}`;
			const categoryOptionComboDimension = `dimension=co`;
			const periodDime = `filter=pe:${pe}`;
			const orgunitDime = `dimension=ou:${ou}`;
			const props = `displayProperty=NAME&skipMeta=false`;
			const APIUrl = `${hostname}${api}?${dataDime}&${periodDime}&${orgunitDime}&${props}`;
			return APIUrl;
		}
	};

	// generateSuperAnalyticsURL = (ou, dx, pe) => {
	// 	const authenticator = new Authenticate();
	// 	const hostname = `https://hmisportal.moh.go.tz/dhis`;
	// 	const api = `api/analytics.json`;
	// 	const dataDime = `dimension=dx:${dx}`;
	// 	const categoryOptionComboDimension = `dimension=co`;
	// 	const periodDime = `filter=pe:${pe}`;
	// 	const orgunitDime = `dimension=ou:${ou}`;
	// 	const props = `displayProperty=NAME&skipMeta=false`;
	// 	const APIUrl = `${hostname}/${api}?${dataDime}&${categoryOptionComboDimension}&${periodDime}&${orgunitDime}&${props}`;
	// 	return APIUrl;
	// };

	generateImportURL = () => {
		const ouAttr = 'hu3ccByV59Z';
		const coAttr = 'unQ3vGsnP1w';
		const deAttr = 'hu3ccByV59Z';
		const authenticator = new Authenticate();
		const hostname = `https://${authenticator.getAuthCredForImport()}41.59.1.89:8080/api/31/dataValueSets`;
		const orgUnitCodeScheme = `orgUnitIdScheme=ATTRIBUTE:${ouAttr}`;
		const dataElementIdScheme = `dataElementIdScheme=ATTRIBUTE:${deAttr}`;
		const categoryOptionComboIdScheme = `categoryOptionComboIdScheme=ATTRIBUTE:${coAttr}`;
		const APIUrl = `${hostname}?${orgUnitCodeScheme}&${dataElementIdScheme}&${categoryOptionComboIdScheme}`;
		return APIUrl;
	};

	generateImportForHIM() {
		const HIMAddressInTestEnvironment = `https://him-dev.moh.go.tz/rest.api/post/JSON/health-datashairing-portal-imes`;
		const HIMAddressLiveEnvironment = `https://him.moh.go.tz/rest.api/post/JSON/health-datashairing-portal-imes`;
		const muunganoGatewayAddr = `http://41.59.1.83:5001/hmis-to-imes`; //Muungano Address
		const authenticator = new Authenticate();
		return HIMAddressInTestEnvironment;
		// return muunganoGatewayAddr;
	}

	generateImportForMNIS() {
		const MNISImportAddress = `https://nutrition.hisptz.org/nutrition/api/dataValueSets?dataElementIdScheme=uid&orgUnitIdScheme=uid&importStrategy=CREATE_AND_UPDATE`;
		return MNISImportAddress;
	}

	getData = async url => {
		const logger = new Logger();
		const authenticator = new Authenticate();
		try {
			return await axios
				.get(url, authenticator.getHMISPortalSuperAuth())
				.catch(error =>
					logger.printLogMessageInConsole('error', error)
				);
		} catch (error) {
			logger.printLogMessageInConsole('error', error);
		}
	};
}

module.exports = MediatorService;
