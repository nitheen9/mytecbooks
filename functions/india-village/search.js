const RESOURCE_ID =
    "c967fe8f-69c4-42df-8afc-8a2c98057437";

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

    const url =
        new URL(context.request.url);

    const query =
        (
            url.searchParams.get("q") || ""
        ).trim();

    if (query.length < 2) {

        return jsonResponse(
            {
                query,
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
        query.toLowerCase();

    try {

        /*
         * Search all states in parallel.
         *
         * Each state starts with the first
         * 1000 records.
         */

        const stateResults =
            await Promise.all(
                STATES.map(
                    function(state) {

                        return searchState(
                            apiKey,
                            state,
                            searchText
                        );

                    }
                )
            );

        const results = [];

        const seen =
            new Set();

        for (
            const stateResult of stateResults
        ) {

            for (
                const item of stateResult
            ) {

                if (
                    !item ||
                    !item.code
                ) {
                    continue;
                }

                if (
                    seen.has(item.code)
                ) {
                    continue;
                }

                seen.add(item.code);

                results.push(item);

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

        results.sort(
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

                return String(a.state)
                    .localeCompare(
                        String(b.state),
                        "en",
                        {
                            sensitivity:
                                "base"
                        }
                    );

            }
        );

        return jsonResponse({

            query,

            count:
                results.length,

            results:
                results.slice(
                    0,
                    MAX_RESULTS
                )

        });

    }
    catch (error) {

        console.error(
            "LGD search error:",
            error
        );

        return jsonResponse(
            {
                query,
                count: 0,
                results: []
            },
            500
        );
    }
}


/* =========================================
   SEARCH ONE STATE
========================================= */

async function searchState(
    apiKey,
    state,
    searchText
) {

    const matches = [];

    let offset = 0;

    while (
        matches.length < MAX_RESULTS &&
        offset < 50000
    ) {

        const apiUrl =
            buildUrl(
                apiKey,
                state,
                offset
            );

        let response;

        try {

            response =
                await fetch(
                    apiUrl,
                    {
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

        }
        catch (error) {

            console.error(
                "LGD request failed:",
                state,
                error
            );

            break;
        }


        if (
            !response.ok
        ) {

            const errorText =
                await response.text();

            console.error(
                "LGD API error:",
                state,
                response.status,
                errorText
            );

            break;
        }


        const data =
            await response.json();


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


            /*
             * Text-only village-name filter.
             */

            if (
                !village
                    .toLowerCase()
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

                code,

                village,

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


            if (
                matches.length >= MAX_RESULTS
            ) {
                break;
            }

        }


        /*
         * Stop when the state has been
         * completely read.
         */

        const total =
            Number(
                data.total ||
                data.count ||
                0
            );

        const returned =
            records.length;


        if (
            total > 0 &&
            offset + returned >= total
        ) {
            break;
        }


        if (
            returned < PAGE_SIZE
        ) {
            break;
        }


        offset += returned;

    }


    return matches;
}


/* =========================================
   BUILD API URL
========================================= */

function buildUrl(
    apiKey,
    state,
    offset
) {

    return (
        "https://api.data.gov.in/resource/" +
        RESOURCE_ID +
        "?api-key=" +
        encodeURIComponent(apiKey) +
        "&format=json" +
        "&limit=" +
        PAGE_SIZE +
        "&offset=" +
        offset +
        "&filters[stateNameEnglish]=" +
        encodeURIComponent(state)
    );

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

    const text =
        String(value).trim();

    /*
     * API may serialize numeric codes
     * as 216041 or 216041.0
     */

    return text.replace(
        /\.0$/,
        ""
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

        JSON.stringify(data),

        {

            status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=60, s-maxage=300",

                "Access-Control-Allow-Origin":
                    "*"

            }

        }

    );

}
