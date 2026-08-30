export async function onRequest(context) {

    const url =
        new URL(
            context.request.url
        );

    const query =
        (
            url.searchParams.get("q") ||
            ""
        )
        .trim();


    if (
        !/^\d{1,5}$/.test(query)
    ) {

        return jsonResponse(
            {
                query:query,
                results:[]
            },
            400
        );

    }


    const where =
        query.length === 5
            ? "ZCTA5='" + query + "'"
            : "ZCTA5 LIKE '" + query + "%'";


    const apiUrl =
        "https://tigerweb.geo.census.gov/arcgis/rest/services/" +
        "TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1/query" +
        "?where=" +
        encodeURIComponent(where) +
        "&outFields=" +
        encodeURIComponent(
            "ZCTA5,GEOID,BASENAME,NAME,INTPTLAT,INTPTLON"
        ) +
        "&orderByFields=ZCTA5" +
        "&returnGeometry=false" +
        "&resultRecordCount=100" +
        "&f=json";


    try {

        const response =
            await fetch(
                apiUrl,
                {
                    headers:{
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (
            !response.ok
        ) {

            return jsonResponse(
                {
                    query:query,
                    results:[]
                },
                500
            );

        }


        const data =
            await response.json();


        const features =
            Array.isArray(
                data.features
            )
                ? data.features
                : [];


        const results =
            features.map(
                function(feature) {

                    const a =
                        feature.attributes ||
                        {};

                    return {

                        code:
                            String(
                                a.ZCTA5 ||
                                ""
                            ),

                        name:
                            String(
                                a.NAME ||
                                ""
                            ),

                        latitude:
                            String(
                                a.INTPTLAT ||
                                ""
                            ),

                        longitude:
                            String(
                                a.INTPTLON ||
                                ""
                            )

                    };

                }
            )
            .filter(
                function(item) {

                    return /^\d{5}$/.test(
                        item.code
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
            "TIGERweb ZIP search error:",
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

            headers:{

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600, s-maxage=86400"

            }

        }

    );

}
