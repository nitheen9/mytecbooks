const RESOURCE_ID =
    "c967fe8f-69c4-42df-8afc-8a2c98057437";

const API_BASE =
    "https://api.data.gov.in/resource/" +
    RESOURCE_ID;

const PAGE_SIZE = 1000;
const MAX_RESULTS = 100;
const STATE_BATCH_SIZE = 5;

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

    if (query.length < 2) {

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

    if (!apiKey) {

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

    const searchText =
        normalizeText(query);

    const allResults = [];

    const seenCodes =
        new Set();

    /*
     * Process only a few states at a time.
     * This prevents a huge burst of requests.
     */

    for (
        let i = 0;
        i < STATES.length;
        i += STATE_BATCH_SIZE
    ) {

        if (
            allResults.length >=
            MAX_RESULTS
        ) {
            break;
        }

        const stateBatch =
            STATES.slice(
                i,
                i + STATE_BATCH_SIZE
            );

        const batchResults =
            await Promise.all(
                stateBatch.map(
                    function(state) {

                        return searchState(
                            context,
                            apiKey,
                            state,
                            searchText
                        );

                    }
                )
            );

        /*
         * Add successful results.
         * Failed states simply return [].
         */

        for (
            const stateResults of batchResults
        ) {

            if (
                !Array.isArray(
                    stateResults
                )
            ) {
                continue;
            }

            for (
                const item of stateResults
            ) {

                if (
                    !item ||
                    !item.code
                ) {
                    continue;
                }

                if (
                    seenCodes.has(
                        item.code
                    )
                ) {
                    continue;
                }

                seenCodes.add(
                    item.code
                );

                allResults.push(
                    item
                );

                if (
                    allResults.length >=
                    MAX_RESULTS
                ) {
                    break;
                }

            }

            if (
                allResults.length >=
                MAX_RESULTS
            ) {
                break;
            }

        }

    }


    allResults.sort(
        function(a, b) {

            const villageCompare =
                String(a.village)
                    .localeCompare(
                        String(b.village),
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
                String(a.state)
                    .localeCompare(
                        String(b.state),
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

            return String(a.district)
                .localeCompare(
                    String(b.district),
                    "en",
                    {
                        sensitivity:
                            "base"
                    }
                );

        }
    );


    return jsonResponse({

        query: query,

        count:
            allResults.length,

        results:
            allResults.slice(
                0,
                MAX_RESULTS
            )

    });

}


/* =========================================
   SEARCH ONE STATE
========================================= */

async function searchState(
    context,
    apiKey,
    state,
    searchText
) {

    const matches = [];

    let offset = 0;

    /*
     * Prevent an unexpectedly large scan
     * inside one visitor request.
     */

    const MAX_STATE_RECORDS = 50000;


    while (
        offset < MAX_STATE_RECORDS &&
        matches.length < MAX_RESULTS
    ) {

        const apiUrl =
            API_BASE +
            "?api-key=" +
            encodeURIComponent(apiKey) +
            "&format=json" +
            "&limit=" +
            PAGE_SIZE +
            "&offset=" +
            offset +
            "&filters[stateNameEnglish]=" +
            encodeURIComponent(state);


        let response;

        try {

            /*
             * Cloudflare edge cache.
             *
             * The same state/page request
             * can be reused for later searches.
             */

            response =
                await fetch(
                    apiUrl,
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
                "LGD network error:",
                state,
                offset,
                error
            );

            /*
             * Do not fail the entire search.
             */

            break;
        }


        if (
            !response.ok
        ) {

            const errorText =
                await safeText(
                    response
                );

            console.error(
                "LGD API error:",
                state,
                offset,
                response.status,
                errorText
            );

            /*
             * Skip this state/page and
             * continue with other states.
             */

            break;
        }


        let data;

        try {

            data =
                await response.json();

        }
        catch (error) {

            console.error(
                "LGD JSON error:",
                state,
                offset,
                error
            );

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

            if (
                matches.length >=
                MAX_RESULTS
            ) {
                break;
            }


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


            /*
             * Exact text filter:
             *
             * "rampur"
             *
             * matches:
             *
             * Rampur
             * Rampur Kalan
             * Rampur Khurd
             */

            if (
                !normalizeText(village)
                    .includes(
                        searchText
                    )
            ) {

                continue;

            }


            const code =
                normalizeCode(
                    record.villageCode
                );


            if (
                !code
            ) {
                continue;
            }


            matches.push({

                code: code,

                village: village,

                state:
                    String(
                        record.stateNameEnglish ||
                        state
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

            });

        }


        /*
         * Work out whether we've reached
         * the end of this state's records.
         */

        const reportedTotal =
            Number(
                data.total ||
                data.count ||
                0
            );


        if (
            reportedTotal > 0 &&
            offset + records.length >=
                reportedTotal
        ) {

            break;
        }


        /*
         * If fewer than PAGE_SIZE records
         * came back, this is normally the
         * last page.
         */

        if (
            records.length <
            PAGE_SIZE
        ) {

            break;
        }


        offset +=
            records.length;

    }


    return matches;

}


/* =========================================
   NORMALIZE SEARCH TEXT
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
   NORMALIZE VILLAGE CODE
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
   SAFE RESPONSE TEXT
========================================= */

async function safeText(
    response
) {

    try {

        return await response.text();

    }
    catch {

        return "";

    }

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
            status: status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                /*
                 * Keep successful searches
                 * at the Cloudflare edge briefly.
                 */

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
