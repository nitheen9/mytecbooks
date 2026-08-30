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
        .toUpperCase();


    const city =
        (
            requestUrl.searchParams.get(
                "city"
            ) ||
            ""
        )
        .trim();


    if (
        !/^[A-Z]{2}$/.test(state)
    ) {

        return jsonResponse(
            {
                query: city,
                state: state,
                results: []
            },
            400
        );

    }


    if (
        city.length < 2
    ) {

        return jsonResponse(
            {
                query: city,
                state: state,
                results: []
            },
            400
        );

    }


    /*
     * Zippopotam.us place endpoint:
     *
     * /us/state/city
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
                            "application/json",

                        "User-Agent":
                            "MyTecBooks U.S. ZIP Search"
                    }
                }
            );


        if (
            !response.ok
        ) {

            return jsonResponse(
                {
                    query: city,
                    state: state,
                    results: []
                }
            );

        }


        const data =
            await response.json();


        /*
         * The city endpoint returns
         * places/postal-code information.
         */

        const rawPlaces =
            Array.isArray(
                data.places
            )
                ? data.places
                : [];


        const results = [];

        const seen =
            new Set();


        rawPlaces.forEach(
            function(item) {

                const code =
                    String(
                        item[
                            "post code"
                        ] ||
                        item[
                            "postal code"
                        ] ||
                        ""
                    ).trim();


                const place =
                    String(
                        item[
                            "place name"
                        ] ||
                        city
                    ).trim();


                if (
                    !/^\d{5}$/.test(
                        code
                    )
                ) {

                    return;

                }


                if (
                    seen.has(code)
                ) {

                    return;

                }


                seen.add(code);


                results.push({

                    code:
                        code,

                    place:
                        place,

                    state:
                        String(
                            item.state ||
                            ""
                        ),

                    stateAbbreviation:
                        String(
                            item[
                                "state abbreviation"
                            ] ||
                            state
                        ),

                    latitude:
                        String(
                            item.latitude ||
                            ""
                        ),

                    longitude:
                        String(
                            item.longitude ||
                            ""
                        )

                });

            }
        );


        results.sort(
            function(a, b) {

                return Number(a.code) -
                       Number(b.code);

            }
        );


        /*
         * Limit the browser response.
         */

        return jsonResponse({

            query:
                city,

            state:
                state,

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


        return jsonResponse({

            query:
                city,

            state:
                state,

            count:
                0,

            results:
                []

        }, 500);

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
