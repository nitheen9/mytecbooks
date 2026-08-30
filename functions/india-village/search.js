const RESOURCE_ID =
    "c967fe8f-69c4-42df-8afc-8a2c98057437";


/*
 * States / UTs used by LGD.
 *
 * The API page exposes stateNameEnglish
 * as a filter, so we search state-by-state.
 */

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


const STATE_BATCH_SIZE =
    10000;


const MAX_RESULTS =
    100;


export async function onRequest(
    context
) {

    const requestUrl =
        new URL(
            context.request.url
        );


    const query =
        (
            requestUrl.searchParams.get(
                "q"
            ) ||
            ""
        ).trim();


    if (
        query.length < 2
    ) {

        return jsonResponse(
            {
                query:
                    query,

                count:
                    0,

                results:
                    []
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
            "DATA_GOV_IN_API_KEY missing."
        );


        return jsonResponse(
            {
                error:
                    "API configuration error."
            },
            500
        );

    }


    const search =
        query.toLowerCase();


    const results = [];

    const seen =
        new Set();


    try {

        /*
         * Search state-by-state.
         *
         * We first get a large batch for each
         * state and then perform the actual
         * text filter against villageNameEnglish.
         */

        for (
            const state of STATES
        ) {

            if (
                results.length >=
                MAX_RESULTS
            ) {

                break;

            }


            let offset =
                0;


            while (
                results.length <
                    MAX_RESULTS
                &&
                offset <
                    STATE_BATCH_SIZE
            ) {

                const apiUrl =
                    buildApiUrl(
                        apiKey,
                        state,
                        offset
                    );


                const response =
                    await fetch(
                        apiUrl,
                        {
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                if (
                    !response.ok
                ) {

                    const text =
                        await response.text();


                    console.error(
                        "LGD API:",
                        response.status,
                        state,
                        text
                    );


                    /*
                     * Skip a state if the API
                     * rejects it, but continue
                     * searching the others.
                     */

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
                            record[
                                "villageNameEnglish"
                            ] ||
                            ""
                        ).trim();


                    if (
                        !village
                    ) {

                        continue;

                    }


                    /*
                     * ACTUAL TEXT FILTER
                     */

                    if (
                        !village
                            .toLowerCase()
                            .includes(
                                search
                            )
                    ) {

                        continue;

                    }


                    const code =
                        String(
                            record[
                                "villageCode"
                            ] ??
                            ""
                        ).trim();


                    const stateName =
                        String(
                            record[
                                "stateNameEnglish"
                            ] ||
                            state
                        ).trim();


                    const district =
                        String(
                            record[
                                "districtNameEnglish"
                            ] ||
                            ""
                        ).trim();


                    const subDistrict =
                        String(
                            record[
                                "subDistrictNameEnglish"
                            ] ||
                            ""
                        ).trim();


                    if (
                        !code
                    ) {

                        continue;

                    }


                    if (
                        seen.has(code)
                    ) {

                        continue;

                    }


                    seen.add(
                        code
                    );


                    results.push({

                        code:
                            code,

                        village:
                            village,

                        state:
                            stateName,

                        district:
                            district,

                        subDistrict:
                            subDistrict

                    });


                    if (
                        results.length >=
                        MAX_RESULTS
                    ) {

                        break;

                    }

                }


                /*
                 * The API response includes
                 * "count". Stop when this state
                 * has been fully paged.
                 */

                const total =
                    Number(
                        data.count ||
                        0
                    );


                if (
                    total <=
                    offset +
                    records.length
                ) {

                    break;

                }


                offset +=
                    records.length;

            }

        }


        results.sort(
            function(a, b) {

                const villageCompare =
                    a.village.localeCompare(
                        b.village,
                        "en",
                        {
                            sensitivity:
                                "base"
                        }
                    );


                if (
                    villageCompare !==
                    0
                ) {

                    return villageCompare;

                }


                return a.state.localeCompare(
                    b.state,
                    "en",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }
        );


        return jsonResponse({

            query:
                query,

            count:
                results.length,

            results:
                results

        });

    }
    catch (error) {

        console.error(
            "LGD village search error:",
            error
        );


        return jsonResponse(
            {
                query:
                    query,

                count:
                    0,

                results:
                    []
            },
            500
        );

    }

}


/* =========================================
   BUILD API URL
========================================= */

function buildApiUrl(
    apiKey,
    state,
    offset
) {

    return (

        "https://api.data.gov.in/resource/" +

        RESOURCE_ID +

        "?api-key=" +

        encodeURIComponent(
            apiKey
        ) +

        "&format=json" +

        "&limit=" +

        STATE_BATCH_SIZE +

        "&offset=" +

        offset +

        "&filters[stateNameEnglish]=" +

        encodeURIComponent(
            state
        )

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
                    "public, max-age=300, s-maxage=3600",

                "Access-Control-Allow-Origin":
                    "*"

            }

        }

    );

}
