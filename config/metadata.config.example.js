/****
 * Configuration File
 */
const mediatorConfig = {
    example_system: {
        isAllowed: true,
        isUsingHIM: true,
        importURL: 'https://example.com/api/data',
        dataFromURL: 'https://dhis.example.org',
        defaultCOC: '',
        isUsingLiveDhis2: true,
        system: 'example',
        batch1: {
            batchName: 'example-batch',
            orgUnitLevel: 'level-n',
            job1: {
                execute: true,
                pe: {
                    periods: ['THIS_YEAR', 'LAST_YEAR'],
                    subPeriods: [],
                },
                dx: {
                    dataSet: 'k6zc9CSIlST',
                    coc: '',
                    data: [
                        {
                            type: 'dataElement',
                            id: 'hSI5EU3mSEU',
                        },
                        {
                            type: 'INDICATOR',
                            id: 'hSI5EU3mSEU',
                        },
                        {
                            type: 'programIndicator',
                            id: 'hSI5EU3mSEU',
                        },
                    ],
                },
            },
            job2: {
                execute: false,
                pe: {
                    periods: ['2017', '2018', '2019', '2020'],
                    subPeriods: [],
                },
                dx: {
                    dataSet: 'k6zc9CSIlST',
                    data: [
                        {
                            type: 'dataElement',
                            id: 'hSI5EU3mSEU',
                        },
                        {
                            type: 'INDICATOR',
                            id: 'hSI5EU3mSEU',
                        },
                        {
                            type: 'programIndicator',
                            id: 'hSI5EU3mSEU',
                        },
                    ],
                },
            },
        },
    },
};

/***
 * 
 */
module.exports = mediatorConfig;
