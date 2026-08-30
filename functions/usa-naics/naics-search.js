export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);

    const query =
        (requestUrl.searchParams.get("q") || "")
            .trim()
            .toLowerCase();

    if (query.length < 2) {

        return jsonResponse({
            query: query,
            year: 2022,
            results: []
        });

    }

    try {

        const jsonUrl =
            new URL(
                "/data/naics2022_all.json",
                requestUrl
            );

        const response =
            await fetch(
                jsonUrl,
                {
                    cf: {
                        cacheTtl: 86400,
                        cacheEverything: true
                    }
                }
            );

        if (!response.ok) {

            console.error(
                "NAICS JSON load failed:",
                response.status
            );

            return jsonResponse(
                {
                    query: query,
                    year: 2022,
                    results: []
                },
                500
            );
        }

        const records =
            await response.json();

        if (!Array.isArray(records)) {

            console.error(
                "naics2022_all.json is not an array"
            );

            return jsonResponse(
                {
                    query: query,
                    year: 2022,
                    results: []
                },
                500
            );
        }

        /*
         * Keep ONLY valid 6-digit codes.
         */

        const naics =
            records.filter(
                function (item) {

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

        let results = [];


        /*
         * CODE SEARCH
         *
         * Example:
         * 513210
         */

        if (
            /^\d{2,6}$/.test(query)
        ) {

            results =
                naics.filter(
                    function (item) {

                        return String(
                            item.code
                        ).startsWith(
                            query
                        );

                    }
                );

        }

        /*
         * TEXT SEARCH
         *
         * Example:
         * software
         */

        else {

            const words =
                query
                    .split(/\s+/)
                    .filter(Boolean);


            results =
                naics.filter(
                    function (item) {

                        const text =
                            (
                                item.code +
                                " " +
                                item.title
                            )
                            .toLowerCase();

                        return words.every(
                            function (word) {

                                return text.includes(
                                    word
                                );

                            }
                        );

                    }
                );

        }


        /*
         * Remove duplicate codes.
         */

        const seen =
            new Set();

        results =
            results.filter(
                function (item) {

                    const code =
                        String(item.code);

                    if (
                        seen.has(code)
                    ) {

                        return false;

                    }

                    seen.add(code);

                    return true;

                }
            );


        /*
         * Sort by NAICS code.
         */

        results.sort(
            function (a, b) {

                return (
                    Number(a.code) -
                    Number(b.code)
                );

            }
        );


        /*
         * Maximum 50 results.
         */

        results =
            results.slice(
                0,
                50
            );


        return jsonResponse({

            query: query,

            year: 2022,

            count:
                results.length,

            results:
                results.map(
                    function (item) {

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
    catch (error) {

        console.error(
            "2022 NAICS search error:",
            error
        );

        return jsonResponse(
            {
                query: query,
                year: 2022,
                count: 0,
                results: []
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
            status: status,

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
