class UUIDService {
	constructor() {}

	getUid = (keyword, keyLength) => {
		let uuid = '';
		let uuidLength = 11;

		keyword != undefined ? uuid + keyword : uuid;
		keyLength != undefined ? (uuidLength = keyLength) : uuidLength;

		if (keyword != undefined && keyLength != undefined) {
			if (keyword != '') {
				uuid = uuid + keyword + '_';
				uuidLength = keyLength;
			} else {
				uuid = uuid;
			}
		} else if (keyword != undefined && keyLength == undefined) {
			uuid = uuid + keyword + '_';
			uuidLength = uuidLength;
		} else {
			uuid = uuid;
		}

		const randomAlphaNumeric =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let index = 0; index < uuidLength; index++) {
			uuid += randomAlphaNumeric.charAt(
				Math.floor(Math.random() * randomAlphaNumeric.length)
			);
		}
		return uuid;
	};
}

module.exports = UUIDService;
