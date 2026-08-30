import { naics2022 } from "./naics-data.js";

export async function onRequest(context) {

    const url =
        new URL(context.request.url);

    const query =
        (url.searchParams.get("q") || "")
            .trim()
            .toLowerCase();


    if (query.length < 2) {

        return jsonResponse({
            query: query,
            year: 2022,
            count: 0,
            results: []
        });

    }


    /*
     * Ensure we use ONLY
     * 6-digit 2022 NAICS records.
     */

    const records =
        naics2022.filter(
            function(item) {

                return (
                    item &&
                    /^\d{6}$/.test(
                        String(item.code || "")
                    ) &&
                    String(
                        item.title || ""
                    ).trim() !== ""
                );

            }
        );


    let results;


    /*
     * CODE SEARCH
     *
     * Example:
     * 513210
     *
     * A partial code such as 513
     * also shows matching 6-digit codes.
     */

    if (
        /^\d{1,6}$/.test(query)
    ) {

        results =
            records.filter(
                function(item) {

                    return String(
                        item.code
                    ).startsWith(
                        query
                    );

                }
            );

    }

    else {

        /*
         * INDUSTRY SEARCH
         *
         * Example:
         * software
         *
         * Example:
         * computer programming
         */

        const words =
            query
                .split(/\s+/)
                .filter(Boolean);


        results =
            records.filter(
                function(item) {

                    const searchable =
                        (
                            item.code +
                            " " +
                            item.title
                        )
                        .toLowerCase();


                    return words.every(
                        function(word) {

                            return searchable.includes(
                                word
                            );

                        }
                    );

                }
            );

    }


    /*
     * Sort numerically.
     */

    results.sort(
        function(a, b) {

            return (
                Number(a.code) -
                Number(b.code)
            );

        }
    );


    /*
     * Return maximum 50 results.
     */

    results =
        results.slice(
            0,
            50
        );


    return jsonResponse({

        query:
            query,

        year:
            2022,

        count:
            results.length,

        results:
            results.map(
                function(item) {

                    return {

                        code:
                            String(
                                item.code
                            ),

                        title:
                            String(
                                item.title
                            )

                    };

                }
            )

    });

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

            status: status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600, s-maxage=86400"

            }

        }

    );

}
