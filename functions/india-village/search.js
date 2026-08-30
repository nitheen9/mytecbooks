const RESOURCE_ID =
    "c967fe8f-69c4-42df-8afc-8a2c98057437";

const API_BASE =
    "https://api.data.gov.in/resource/" +
    RESOURCE_ID;

const MAX_RESULTS = 100;

const PAGE_SIZE = 1000;

const STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
];


export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);

    const query =
        (
            requestUrl.searchParams.get("q") ||
            ""
        ).trim();


    if (
        query.length < 2
    ) {

        return jsonResponse(
            {
                query: query,
                count: 0,
                results: []
            },
            400
        );

    }


    const apiKey =
        context.env.DATA_GOV_IN_API_KEY;


    if (
        !apiKey
    ) {

        console.error(
            "DATA_GOV_IN_API_KEY is missing."
        );

        return jsonResponse(
            {
                error:
                    "API configuration error."
            },
            500
        );

    }


    try {

        /*
         * FIRST:
         *
         * Search the actual LGD village-name
         * field directly.
         *
         * Try several common capitalizations.
         */

        const directResults =
            await directVillageSearch(
                apiKey,
                query
            );


        if (
            directResults.length > 0
        ) {

            return jsonResponse({

                query: query,

                count:
                    directResults.length,

                results:
                    directResults.slice(
                        0,
                        MAX_RESULTS
                    )

            });

        }


        /*
         * FALLBACK:
         *
         * If direct field filtering does not
         * work for this particular query,
         * use state-based searching.
         */

        const fallbackResults =
            await fallbackStateSearch(
                apiKey,
                query
            );


        return jsonResponse({

            query: query,

            count:
                fallbackResults.length,

            results:
                fallbackResults.slice(
                    0,
                    MAX_RESULTS
                )

        });


    }
    catch (error) {

        console.error(
            "LGD village search error:",
            error
        );


        return jsonResponse(
            {
                query: query,
                count: 0,
                results: []
            },
            500
        );

    }

}


/* =========================================
   DIRECT VILLAGE NAME SEARCH
========================================= */

async function directVillageSearch(
    apiKey,
    query
) {

    const variants =
        buildQueryVariants(
            query
        );


    const requests =
        variants.map(
            function(value) {

                return fetchDirectFilter(
                    apiKey,
                    value
                );

            }
        );


    const responses =
        await Promise.all(
            requests
        );


    const results = [];

    const seen =
        new Set();


    for (
        const records of responses
    ) {

        for (
            const record of records
        ) {

            const item =
                convertRecord(
                    record
                );


            if (
                !item
            ) {

                continue;

            }


            /*
             * Make sure the actual village
             * name contains the search text.
             */

            if (
                !normalizeText(
                    item.village
                ).includes(
                    normalizeText(query)
                )
            ) {

                continue;

            }


            if (
                seen.has(
                    item.code
                )
            ) {

                continue;

            }


            seen.add(
                item.code
            );


            results.push(
                item
            );


            if (
                results.length >=
                MAX_RESULTS
            ) {

                return results;

            }

        }

    }


    return results;

}


/* =========================================
   DIRECT API REQUEST
========================================= */

async function fetchDirectFilter(
    apiKey,
    villageName
) {

    const url =
        API_BASE +
        "?api-key=" +
        encodeURIComponent(apiKey) +
        "&format=json" +
        "&limit=100" +
        "&offset=0" +
        "&filters[villageNameEnglish]=" +
        encodeURIComponent(villageName);


    try {

        const response =
            await fetch(
                url,
                {
                    cf: {
                        cacheTtl: 86400,
                        cacheEverything: true
                    },

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (
            !response.ok
        ) {

            console.error(
                "Direct village filter:",
                response.status
            );

            return [];

        }


        const data =
            await response.json();


        return Array.isArray(
            data.records
        )
            ? data.records
            : [];

    }
    catch (error) {

        console.error(
            "Direct village request error:",
            error
        );

        return [];

    }

}


/* =========================================
   QUERY VARIANTS
========================================= */

function buildQueryVariants(
    value
) {

    const original =
        String(
            value || ""
        ).trim();


    const lower =
        original.toLowerCase();


    const upper =
        original.toUpperCase();


    const title =
        lower.replace(
            /\b\w/g,
            function(letter) {
                return letter.toUpperCase();
            }
        );


    return [
        original,
        lower,
        upper,
        title
    ].filter(
        function(item, index, array) {

            return (
                item &&
                array.indexOf(item) === index
            );

        }
    );

}


/* =========================================
   FALLBACK STATE SEARCH
========================================= */

async function fallbackStateSearch(
    apiKey,
    query
) {

    const results = [];

    const seen =
        new Set();


    /*
     * Search only 5 states simultaneously.
     * This is much safer than starting
     * every state request together.
     */

    const BATCH_SIZE = 5;


    for (
        let i = 0;
        i < STATES.length;
        i += BATCH_SIZE
    ) {

        if (
            results.length >=
            MAX_RESULTS
        ) {

            break;

        }


        const batch =
            STATES.slice(
                i,
                i + BATCH_SIZE
            );


        const stateResults =
            await Promise.all(
                batch.map(
                    function(state) {

                        return searchState(
                            apiKey,
                            state,
                            query
                        );

                    }
                )
            );


        for (
            const matches of stateResults
        ) {

            for (
                const item of matches
            ) {

                if (
                    !item ||
                    !item.code
                ) {

                    continue;

                }


                if (
                    seen.has(
                        item.code
                    )
                ) {

                    continue;

                }


                seen.add(
                    item.code
                );


                results.push(
                    item
                );


                if (
                    results.length >=
                    MAX_RESULTS
                ) {

                    break;

                }

            }


            if (
                results.length >=
                MAX_RESULTS
            ) {

                break;

            }

        }

    }


    results.sort(
        sortResults
    );


    return results;

}


/* =========================================
   SEARCH STATE
========================================= */

async function searchState(
    apiKey,
    state,
    query
) {

    const matches = [];

    const normalizedQuery =
        normalizeText(
            query
        );


    /*
     * We limit the amount of one-state
     * scanning done for a single request.
     */

    const MAX_STATE_PAGES = 50;


    for (
        let page = 0;
        page < MAX_STATE_PAGES;
        page++
    ) {

        const offset =
            page * PAGE_SIZE;


        const url =
            API_BASE +
            "?api-key=" +
            encodeURIComponent(
                apiKey
            ) +
            "&format=json" +
            "&limit=" +
            PAGE_SIZE +
            "&offset=" +
            offset +
            "&filters[stateNameEnglish]=" +
            encodeURIComponent(
                state
            );


        let response;


        try {

            response =
                await fetch(
                    url,
                    {
                        cf: {
                            cacheTtl: 86400,
                            cacheEverything: true
                        },

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

        }
        catch (error) {

            console.error(
                "State request error:",
                state,
                error
            );

            break;

        }


        if (
            !response.ok
        ) {

            console.error(
                "State API error:",
                state,
                response.status
            );

            break;

        }


        let data;


        try {

            data =
                await response.json();

        }
        catch {

            break;

        }


        const records =
            Array.isArray(
                data.records
            )
                ? data.records
                : [];


        if (
            records.length === 0
        ) {

            break;

        }


        for (
            const record of records
        ) {

            const village =
                String(
                    record.villageNameEnglish ||
                    ""
                ).trim();


            if (
                !village
            ) {

                continue;

            }


            if (
                !normalizeText(
                    village
                ).includes(
                    normalizedQuery
                )
            ) {

                continue;

            }


            const item =
                convertRecord(
                    record
                );


            if (
                item
            ) {

                matches.push(
                    item
                );

            }


            if (
                matches.length >=
                MAX_RESULTS
            ) {

                break;

            }

        }


        if (
            matches.length >=
            MAX_RESULTS
        ) {

            break;

        }


        const total =
            Number(
                data.total ||
                data.count ||
                0
            );


        if (
            total > 0 &&
            offset + records.length >=
            total
        ) {

            break;

        }


        if (
            records.length <
            PAGE_SIZE
        ) {

            break;

        }

    }


    return matches;

}


/* =========================================
   CONVERT RECORD
========================================= */

function convertRecord(
    record
) {

    if (
        !record
    ) {

        return null;

    }


    const code =
        normalizeCode(
            record.villageCode
        );


    const village =
        String(
            record.villageNameEnglish ||
            ""
        ).trim();


    if (
        !code ||
        !village
    ) {

        return null;

    }


    return {

        code:

            code,

        village:

            village,

        state:

            String(
                record.stateNameEnglish ||
                ""
            ).trim(),

        district:

            String(
                record.districtNameEnglish ||
                ""
            ).trim(),

        subDistrict:

            String(
                record.subDistrictNameEnglish ||
                ""
            ).trim()

    };

}


/* =========================================
   NORMALIZE TEXT
========================================= */

function normalizeText(
    value
) {

    return String(
        value || ""
    )
        .normalize("NFKC")
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .toLowerCase();

}


/* =========================================
   NORMALIZE CODE
========================================= */

function normalizeCode(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    )
        .trim()
        .replace(
            /\.0$/,
            ""
        );

}


/* =========================================
   SORT RESULTS
========================================= */

function sortResults(
    a,
    b
) {

    const villageCompare =
        String(
            a.village
        ).localeCompare(
            String(
                b.village
            ),
            "en",
            {
                sensitivity:
                    "base"
            }
        );


    if (
        villageCompare !== 0
    ) {

        return villageCompare;

    }


    const stateCompare =
        String(
            a.state
        ).localeCompare(
            String(
                b.state
            ),
            "en",
            {
                sensitivity:
                    "base"
            }
        );


    if (
        stateCompare !== 0
    ) {

        return stateCompare;

    }


    return String(
        a.district
    ).localeCompare(
        String(
            b.district
        ),
        "en",
        {
            sensitivity:
                "base"
        }
    );

}


/* =========================================
   JSON RESPONSE
========================================= */

function jsonResponse(
    data,
    status = 200
) {

    return new Response(

        JSON.stringify(
            data
        ),

        {

            status:
                status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    status === 200
                        ? "public, max-age=300, s-maxage=1800"
                        : "no-store",

                "Access-Control-Allow-Origin":
                    "*"

            }

        }

    );

}
