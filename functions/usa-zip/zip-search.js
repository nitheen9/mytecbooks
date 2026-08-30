export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);

    const query =
        (
            requestUrl.searchParams.get("q") || ""
        )
        .trim();


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


    /*
     * Search USGS postal records using
     * the user's text.
     *
     * Example:
     *
     * Wishon
     *
     * becomes:
     *
     * *Wishon*
     */

    const searchTerm =
        "*" +
        query +
        "*";


    const apiUrl =
        "https://dashboard.waterdata.usgs.gov/" +
        "service/geocoder/get/location/1.0" +
        "?term=" +
        encodeURIComponent(searchTerm) +
        "&include=postal" +
        "&maxSuggestions=200";


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


        if (!response.ok) {

            console.error(
                "USGS HTTP status:",
                response.status
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


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            return jsonResponse({

                query: query,

                count: 0,

                results: []

            });

        }


        const results = [];

        const seen =
            new Set();


        /*
         * IMPORTANT:
         *
         * Do not filter the entire Name
         * incorrectly.
         *
         * USGS postal records are commonly:
         *
         * 93669 Wishon
         */

        data.forEach(
            function(item) {

                if (
                    !item ||
                    item.Source !== "postal"
                ) {

                    return;

                }


                const rawName =
                    String(
                        item.Name || ""
                    ).trim();


                /*
                 * Extract:
                 *
                 * ZIP = 93669
                 * Area = Wishon
                 */

                const match =
                    rawName.match(
                        /^(\d{5})\s+(.+)$/i
                    );


                if (!match) {

                    return;

                }


                const code =
                    match[1];


                const area =
                    match[2].trim();


                /*
                 * TEXT FILTER
                 *
                 * Search ONLY the human-readable
                 * area/name portion.
                 *
                 * Case insensitive.
                 */

                if (
                    !area
                        .toLowerCase()
                        .includes(
                            query.toLowerCase()
                        )
                ) {

                    return;

                }


                /*
                 * One result per ZIP.
                 */

                if (
                    seen.has(code)
                ) {

                    return;

                }


                seen.add(code);


                results.push({

                    code:
                        code,

                    name:
                        area,

                    county:
                        String(
                            item.County || ""
                        ),

                    stateCode:
                        String(
                            item.State || ""
                        )
                        .trim()
                        .toUpperCase(),

                    state:
                        getStateName(
                            String(
                                item.State || ""
                            )
                            .trim()
                            .toUpperCase()
                        ),

                    latitude:
                        item.Latitude ??
                        "",

                    longitude:
                        item.Longitude ??
                        ""

                });

            }
        );


        /*
         * Sort by ZIP.
         */

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
            "USGS ZIP text search error:",
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
   STATE NAME
========================================= */

function getStateName(code) {

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

        DC:"District of Columbia",

        AS:"American Samoa",
        FM:"Federated States of Micronesia",
        GU:"Guam",
        MH:"Marshall Islands",
        MP:"Northern Mariana Islands",
        PR:"Puerto Rico",
        PW:"Palau",
        VI:"U.S. Virgin Islands",
        UM:"U.S. Minor Outlying Islands"

    };


    return (
        states[code] ||
        code
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
