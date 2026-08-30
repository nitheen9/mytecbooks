export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);

    const query =
        (
            requestUrl.searchParams.get("q") ||
            ""
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
     * USGS Geocoder:
     *
     * Search the term as a location and
     * request postal ZIP-code records.
     *
     * Wildcards let a city/area name match
     * within the returned postal record.
     */

    const searchTerm =
        "*" + query + "*";

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
         * Keep only postal records.
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
                 * USGS postal Name is normally:
                 *
                 * 93669 Wishon
                 */

                const zipMatch =
                    rawName.match(
                        /^(\d{5})\s+(.*)$/
                    );

                if (!zipMatch) {

                    return;

                }

                const zip =
                    zipMatch[1];

                const place =
                    zipMatch[2].trim();


                /*
                 * Make sure the search term
                 * actually occurs in the place
                 * name, case-insensitive.
                 *
                 * This prevents unrelated
                 * postal suggestions.
                 */

                if (
                    !place
                        .toLowerCase()
                        .includes(
                            query.toLowerCase()
                        )
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

                    name:
                        place,

                    county:
                        String(
                            item.County || ""
                        ),

                    stateCode:
                        String(
                            item.State || ""
                        ).toUpperCase(),

                    state:
                        getStateName(
                            String(
                                item.State || ""
                            ).toUpperCase()
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
            "USGS ZIP city search error:",
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
        DC:"District of Columbia",

        AS:"American Samoa",
        FM:"Federated States of Micronesia",
        GU:"Guam",
        MH:"Marshall Islands",
        MP:"Northern Mariana Islands",
        PR:"Puerto Rico",
        PW:"Palau",
        VI:"U.S. Virgin Islands"

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
                    "public, max-age=3600, s-maxage=86400",

                "Access-Control-Allow-Origin":
                    "*"

            }

        }

    );

}
