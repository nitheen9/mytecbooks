export async function onRequest(context) {

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
        )
        .trim();


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


    /*
     * Government of India OGD
     *
     * Catalog:
     *
     * fd5ac8e1-32cd-4f74-b95e-fd55b76d53e0
     */

    const apiUrl =
        "https://api.data.gov.in" +
        "/catalog/fd5ac8e1-32cd-4f74-b95e-fd55b76d53e0" +
        "?api-key=" +
        encodeURIComponent(
            apiKey
        ) +
        "&format=json" +
        "&limit=100" +
        "&offset=0" +
        "&filters[area_name]=" +
        encodeURIComponent(
            query
        );


    try {

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

            const errorText =
                await response.text();


            console.error(
                "data.gov.in status:",
                response.status,
                errorText
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
                response.status === 403
                    ? 403
                    : 500
            );

        }


        const data =
            await response.json();


        /*
         * Different OGD responses can expose
         * records using different property names.
         */

        const records =
            getRecords(
                data
            );


        const results = [];

        const seen =
            new Set();


        records.forEach(
            function(record) {

                const village =
                    getField(
                        record,
                        [
                            "area_name",
                            "AREA NAME",
                            "Village Name",
                            "VILLAGE NAME",
                            "village_name",
                            "village",
                            "VILLAGE",
                            "Town/Village Name",
                            "Town Village Name"
                        ]
                    );


                const state =
                    getField(
                        record,
                        [
                            "state_name",
                            "STATE NAME",
                            "State Name",
                            "state"
                        ]
                    );


                const district =
                    getField(
                        record,
                        [
                            "district_name",
                            "DISTRICT NAME",
                            "District Name",
                            "district"
                        ]
                    );


                const subDistrict =
                    getField(
                        record,
                        [
                            "sub_district_name",
                            "SUB-DISTRICT NAME",
                            "Sub-District Name",
                            "sub_district",
                            "SUB DISTRICT NAME"
                        ]
                    );


                const code =
                    getField(
                        record,
                        [
                            "mdds_plcn",
                            "MDDS PLCN",
                            "village_code",
                            "VILLAGE CODE",
                            "Village Code",
                            "town_village_code",
                            "Town Village Code"
                        ]
                    );


                const documentId =
                    getField(
                        record,
                        [
                            "document_id",
                            "DOCUMENT ID",
                            "Document ID"
                        ]
                    );


                if (
                    !village
                ) {

                    return;

                }


                /*
                 * The search is text based on
                 * Area Name / village name.
                 */

                if (
                    !village
                        .toLowerCase()
                        .includes(
                            query.toLowerCase()
                        )
                ) {

                    return;

                }


                /*
                 * Prefer the village/location code
                 * as the unique identifier.
                 */

                const uniqueId =
                    String(
                        code ||
                        documentId ||
                        (
                            village +
                            "|" +
                            state +
                            "|" +
                            district +
                            "|" +
                            subDistrict
                        )
                    ).trim();


                const key =
                    uniqueId;


                if (
                    seen.has(key)
                ) {

                    return;

                }


                seen.add(
                    key
                );


                results.push({

                    code:
                        uniqueId,

                    village:
                        village,

                    state:
                        state,

                    district:
                        district,

                    subDistrict:
                        subDistrict

                });

            }
        );


        results.sort(
            function(a, b) {

                return String(
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

            }
        );


        return jsonResponse({

            query:
                query,

            count:
                results.length,

            results:
                results.slice(
                    0,
                    100
                )

        });


    }
    catch (error) {

        console.error(
            "India village API error:",
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
   GET RECORDS
========================================= */

function getRecords(
    data
) {

    if (
        Array.isArray(data)
    ) {

        return data;

    }


    if (
        data &&
        Array.isArray(
            data.records
        )
    ) {

        return data.records;

    }


    if (
        data &&
        Array.isArray(
            data.data
        )
    ) {

        return data.data;

    }


    if (
        data &&
        Array.isArray(
            data.results
        )
    ) {

        return data.results;

    }


    return [];

}


/* =========================================
   GET FIELD
========================================= */

function getField(
    record,
    names
) {

    if (
        !record ||
        typeof record !== "object"
    ) {

        return "";

    }


    /*
     * Exact field names first.
     */

    for (
        const name of names
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                record,
                name
            )
        ) {

            const value =
                record[name];


            if (
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
            ) {

                return String(
                    value
                ).trim();

            }

        }

    }


    /*
     * Case-insensitive fallback.
     */

    const keys =
        Object.keys(
            record
        );


    for (
        const wanted of names
    ) {

        const found =
            keys.find(
                function(key) {

                    return (
                        key.toLowerCase() ===
                        wanted.toLowerCase()
                    );

                }
            );


        if (
            found
        ) {

            const value =
                record[found];


            if (
                value !== null &&
                value !== undefined &&
                String(value).trim() !== ""
            ) {

                return String(
                    value
                ).trim();

            }

        }

    }


    return "";

}


/* =========================================
   JSON
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
                    "public, max-age=3600, s-maxage=86400",

                "Access-Control-Allow-Origin":
                    "*"

            }

        }

    );

}
