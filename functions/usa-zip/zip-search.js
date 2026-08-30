export async function onRequest(context) {

    const requestUrl =
        new URL(
            context.request.url
        );


    const state =
        (
            requestUrl.searchParams.get(
                "state"
            ) ||
            ""
        )
        .trim()
        .toLowerCase();


    const city =
        (
            requestUrl.searchParams.get(
                "city"
            ) ||
            ""
        )
        .trim()
        .toLowerCase();


    if (
        !/^[a-z]{2}$/.test(state)
    ) {

        return jsonResponse(
            {
                query:
                    city,

                state:
                    state,

                count:
                    0,

                results:
                    []
            },
            400
        );

    }


    if (
        city.length < 2
    ) {

        return jsonResponse(
            {
                query:
                    city,

                state:
                    state,

                count:
                    0,

                results:
                    []
            },
            400
        );

    }


    /*
     * Zippopotam.us city/state API
     *
     * Example:
     *
     * /us/ca/wishon
     */

    const apiUrl =
        "https://api.zippopotam.us/us/" +
        encodeURIComponent(state) +
        "/" +
        encodeURIComponent(city);


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

            return jsonResponse({

                query:
                    city,

                state:
                    state,

                count:
                    0,

                results:
                    []

            });

        }


        const data =
            await response.json();


        const places =
            Array.isArray(
                data.places
            )
                ? data.places
                : [];


        const results = [];

        const seen =
            new Set();


        places.forEach(
            function(place) {

                const zip =
                    String(
                        place[
                            "post code"
                        ] ||
                        ""
                    ).trim();


                const placeName =
                    String(
                        place[
                            "place name"
                        ] ||
                        city
                    ).trim();


                if (
                    !/^\d{5}$/.test(zip)
                ) {

                    return;

                }


                if (
                    seen.has(zip)
                ) {

                    return;

                }


                seen.add(zip);


                results.push({

                    code:
                        zip,

                    place:
                        placeName,

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

                });

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
                city,

            state:
                state,

            count:
                results.length,

            results:
                results

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
                    city,

                state:
                    state,

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
                    "public, max-age=3600, s-maxage=86400"

            }

        }

    );

}
