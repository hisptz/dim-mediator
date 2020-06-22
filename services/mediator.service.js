/***
 *
 */
const axios = require('axios');
const _ = require('lodash');

/***
 *
 */
const Logger = require('../logs/logger.log');
const Authenticate = require('../auth/system.auth');
const Utilities = require('../utils/utils');
const AuthConfig = require('../config/auth.config');

/***
 *
 */
class MediatorService {
	APIURLS = [];

	/**
	 *
	 */
	constructor() { }

	/***
	 *
	 */
	async generateAnalyticsURL(activeSystem, apiFromURL, pe, ou, dx) {
		/***
		 *
		 */
		const logger = new Logger();
		const authenticator = new Authenticate();
		const utilities = new Utilities();

		/***
		 *
		 */
		const hostname = await `https://${authenticator.getSystemAuthForAPICall(
			AuthConfig,
			activeSystem
		)}${utilities.URLSanitizer(apiFromURL)}`;
		const api = await `api/analytics.json`;
		const dataDime = await `dimension=dx:${
			dx.id
			}&${await this.getFormattedDimensionCOForDataElement(
				dx,
				activeSystem
			)}`;
		const periodDime = await `filter=pe:${pe}`;
		const orgunitDime = `dimension=ou:${ou}`;
		const props = await `displayProperty=NAME&skipMeta=false`;
		const APIUrl = await `${hostname}${api}?${dataDime}&${periodDime}&${orgunitDime}&${props}`;
		return APIUrl;
	}

	getFormattedDimensionCOForDataElement = async (dx, activeSystem) => {
		const logger = new Logger();
		const utilities = new Utilities();
		const dimensionMetadata = await this.getFormattedAnalyticsDXUrl(
			dx,
			activeSystem
		);
		if (dx && activeSystem) {
			if (dimensionMetadata === 'dimension=co') {
				return dimensionMetadata;
			} else {
				console.log
				await utilities.joinBySymbol(dimensionMetadata, '&');
			}
		} else {
			logger.printLogMessageInConsole(
				'error',
				`No active system or data found`,
				activeSystem
			);
		}
	};

	/***
	 *
	 */
	getFormattedAnalyticsDXUrl = (dx, activeSystem) => {
		/***
		 *
		 */
		const logger = new Logger();
		const utilities = new Utilities();
		/***
		 *
		 */
		return _.has(dx, 'dimensions') && dx.dimensions.length > 0
			? _.map(dx.dimensions, (category) => {
				return `dimension=${
					category.id
					}:${utilities.joinBySymbol(
						category.options,
						';'
					)}`;
			})
			: dx.type === 'DATA_ELEMENT'
				? `dimension=co`
				: [];
	};

	/**
	 *
	 */
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

	/**
	 *
	 */
	generateImportForHIM() {
		const HIMAddressInTestEnvironment = `https://him-dev.moh.go.tz/rest.api/post/JSON/health-datashairing-portal-imes`;
		const HIMAddressLiveEnvironment = `https://him.moh.go.tz/rest.api/post/JSON/health-datashairing-portal-imes`;
		const muunganoGatewayAddr = `http://41.59.1.83:5001/hmis-to-imes`; //Muungano Address
		const authenticator = new Authenticate();
		return HIMAddressInTestEnvironment;
		// return muunganoGatewayAddr;
	}

	/**
	 *
	 */
	getData = async (url) => {
		const logger = new Logger();
		const authenticator = new Authenticate();
		try {
			return await axios
				.get(url, authenticator.getHMISPortalSuperAuth())
				.catch((error) =>
					logger.printLogMessageInConsole('error', error)
				);
		} catch (error) {
			logger.printLogMessageInConsole('error', error);
		}
	};
}

/**
 *
 */
module.exports = MediatorService;
