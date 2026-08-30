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

                results:
                    []
            },
            400
        );

    }


    /*
     * USGS public geocoder.
     *
     * Use the postal location type
     * only.
     */

    const apiUrl =
        "https://dashboard.waterdata.usgs.gov/" +
        "service/geocoder/get/location/1.0" +
        "?term=" +
        encodeURIComponent(query) +
        "&include=postal";


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

            console.error(
                "USGS search HTTP:",
                response.status
            );


            return jsonResponse(
                {
                    query:
                        query,

                    results:
                        []
                },
                500
            );

        }


        const data =
            await response.json();


        if (
            !Array.isArray(data)
        ) {

            return jsonResponse({

                query:
                    query,

                results:
                    []

            });

        }


        /*
         * Keep postal results only.
         */

        const postalResults =
            data.filter(
                function(item) {

                    return (
                        item &&
                        item.Source === "postal" &&
                        /^\d{5}$/.test(
                            String(
                                extractZip(item.Name)
                            )
                        )
                    );

                }
            );


        const results = [];

        const seen =
            new Set();


        postalResults.forEach(
            function(item) {

                const code =
                    extractZip(
                        item.Name
                    );


                if (
                    !code ||
                    seen.has(code)
                ) {

                    return;

                }


                seen.add(code);


                const city =
                    extractCity(
                        item.Name,
                        code
                    );


                results.push({

                    code:
                        code,

                    name:
                        city,

                    county:
                        String(
                            item.County ||
                            ""
                        ),

                    state:
                        getStateName(
                            String(
                                item.State ||
                                ""
                            ).toUpperCase()
                        ),

                    stateCode:
                        String(
                            item.State ||
                            ""
                        ).toUpperCase(),

                    latitude:
                        item.Latitude ??
                        "",

                    longitude:
                        item.Longitude ??
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
            "USGS city search error:",
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
   EXTRACT ZIP
========================================= */

function extractZip(
    name
) {

    const value =
        String(
            name || ""
        ).trim();


    const match =
        value.match(
            /^\s*(\d{5})\b/
        );


    return match
        ? match[1]
        : "";

}


/* =========================================
   EXTRACT CITY
========================================= */

function extractCity(
    name,
    zipcode
) {

    let value =
        String(
            name || ""
        ).trim();


    value =
        value.replace(
            new RegExp(
                "^" +
                escapeRegex(zipcode) +
                "\\s*",
                "i"
            ),
            ""
        );


    return value.trim();

}


/* =========================================
   STATE NAME
========================================= */

function getStateName(
    code
) {

    const states = {

        AL:"Alabama",
        AK:"Alaska",
        AZ:"Arizona",
        AR:"Arkansas",
        CA:"California",
        CO:"Colorado",
        CT:"Connecticut",
        DE:"Delaware",
        FL:"Florida",
        GA:"Georgia",
        HI:"Hawaii",
        ID:"Idaho",
        IL:"Illinois",
        IN:"Indiana",
        IA:"Iowa",
        KS:"Kansas",
        KY:"Kentucky",
        LA:"Louisiana",
        ME:"Maine",
        MD:"Maryland",
        MA:"Massachusetts",
        MI:"Michigan",
        MN:"Minnesota",
        MS:"Mississippi",
        MO:"Missouri",
        MT:"Montana",
        NE:"Nebraska",
        NV:"Nevada",
        NH:"New Hampshire",
        NJ:"New Jersey",
        NM:"New Mexico",
        NY:"New York",
        NC:"North Carolina",
        ND:"North Dakota",
        OH:"Ohio",
        OK:"Oklahoma",
        OR:"Oregon",
        PA:"Pennsylvania",
        RI:"Rhode Island",
        SC:"South Carolina",
        SD:"South Dakota",
        TN:"Tennessee",
        TX:"Texas",
        UT:"Utah",
        VT:"Vermont",
        VA:"Virginia",
        WA:"Washington",
        WV:"West Virginia",
        WI:"Wisconsin",
        WY:"Wyoming",
        DC:"District of Columbia"

    };


    return (
        states[code] ||
        code
    );

}


/* =========================================
   ESCAPE REGEX
========================================= */

function escapeRegex(
    value
) {

    return String(value)

        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
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
