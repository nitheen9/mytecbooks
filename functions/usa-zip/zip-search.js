const STATES = [

    "al",
    "ak",
    "az",
    "ar",
    "ca",
    "co",
    "ct",
    "de",
    "fl",
    "ga",
    "hi",
    "id",
    "il",
    "in",
    "ia",
    "ks",
    "ky",
    "la",
    "me",
    "md",
    "ma",
    "mi",
    "mn",
    "ms",
    "mo",
    "mt",
    "ne",
    "nv",
    "nh",
    "nj",
    "nm",
    "ny",
    "nc",
    "nd",
    "oh",
    "ok",
    "or",
    "pa",
    "ri",
    "sc",
    "sd",
    "tn",
    "tx",
    "ut",
    "vt",
    "va",
    "wa",
    "wv",
    "wi",
    "wy",
    "dc"

];


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


    try {

        /*
         * Search all U.S. states because
         * the user enters only the city/area.
         */

        const requests =
            STATES.map(
                async function(state) {

                    const apiUrl =
                        "https://api.zippopotam.us/us/" +
                        state +
                        "/" +
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

                            return [];

                        }


                        const data =
                            await response.json();


                        if (
                            !data ||
                            !Array.isArray(
                                data.places
                            )
                        ) {

                            return [];

                        }


                        return data.places.map(
                            function(place) {

                                return {

                                    code:
                                        String(
                                            place[
                                                "post code"
                                            ] ||
                                            ""
                                        ).trim(),

                                    place:
                                        String(
                                            place[
                                                "place name"
                                            ] ||
                                            ""
                                        ).trim(),

                                    state:
                                        String(
                                            place.state ||
                                            ""
                                        ).trim(),

                                    stateCode:
                                        String(
                                            place[
                                                "state abbreviation"
                                            ] ||
                                            state
                                        )
                                        .trim()
                                        .toUpperCase(),

                                    latitude:
                                        place.latitude ??
                                        "",

                                    longitude:
                                        place.longitude ??
                                        ""

                                };

                            }
                        );

                    }
                    catch (error) {

                        return [];

                    }

                }
            );


        const groups =
            await Promise.all(
                requests
            );


        const allResults =
            groups.flat();


        const results = [];

        const seen =
            new Set();


        allResults.forEach(
            function(item) {

                if (
                    !/^\d{5}$/.test(
                        item.code
                    )
                ) {

                    return;

                }


                if (
                    !item.place
                ) {

                    return;

                }


                /*
                 * Text filter.
                 *
                 * The returned place must contain
                 * the user's search text.
                 */

                if (
                    !item.place
                        .toLowerCase()
                        .includes(
                            query.toLowerCase()
                        )
                ) {

                    return;

                }


                /*
                 * Remove duplicate ZIPs.
                 */

                if (
                    seen.has(
                        item.code
                    )
                ) {

                    return;

                }


                seen.add(
                    item.code
                );


                results.push(
                    item
                );

            }
        );


        results.sort(
            function(a, b) {

                return (
                    Number(a.code) -
                    Number(b.code)
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
            "ZIP city search error:",
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
   JSON RESPONSE
========================================= */

function jsonResponse(
    data,
    status = 200
) {

    return new Response(

        JSON.stringify(data),

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
