export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);


    const query =
        (requestUrl.searchParams.get("q") || "")
        .trim();


    if (query.length < 2) {

        return jsonResponse({

            query: query,

            results: []

        });

    }


    try {


        /*
         * Official U.S. Census NAICS search.
         *
         * Example:
         *
         * https://www.census.gov/naics/?input=software&year=2022
         */

        const censusUrl =
            "https://www.census.gov/naics/?input=" +
            encodeURIComponent(query) +
            "&year=2022";


        const response =
            await fetch(
                censusUrl,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS Search)",

                        "Accept":
                            "text/html,application/xhtml+xml"

                    }

                }
            );


        if (!response.ok) {


            console.error(
                "Census HTTP status:",
                response.status
            );


            return jsonResponse({

                query: query,

                results: []

            });

        }


        const html =
            await response.text();


        const results =
            parseCensusResults(
                html
            );


        return jsonResponse({

            query: query,

            results:
                results.slice(
                    0,
                    50
                )

        });


    }
    catch (error) {


        console.error(
            "NAICS search error:",
            error
        );


        return jsonResponse({

            query: query,

            results: []

        });

    }

}


/* =========================================
   PARSE CENSUS NAICS RESULTS
========================================= */

function parseCensusResults(html) {


    const results = [];

    const seen =
        new Set();


    /*
     * Census result links normally contain:
     *
     * details=541511
     *
     * input=54151
     *
     * year=2022
     *
     * We extract the 2-6 digit NAICS code
     * and the text associated with the link.
     */


    const regex =
        /<a[^>]+href=["']([^"']*naics[^"']*details=(\d{2,6})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (match = regex.exec(html)) !== null
    ) {


        const url =
            match[1];


        const code =
            match[2];


        let linkText =
            match[3];


        linkText =
            stripHtml(
                linkText
            );


        linkText =
            decodeHtml(
                linkText
            );


        linkText =
            cleanText(
                linkText
            );


        if (
            !code ||
            !linkText
        ) {

            continue;

        }


        /*
         * Sometimes Census text contains:
         *
         * 541511 Custom Computer Programming Services
         *
         * Remove the code from the title.
         */

        let title =
            linkText
            .replace(
                new RegExp(
                    "^" +
                    escapeRegex(code) +
                    "\\s*[:\\-]?\\s*",
                    "i"
                ),
                ""
            )
            .trim();


        /*
         * Remove classification suffixes.
         */

        title =
            title
            .replace(
                /\s*\^(?:T|US)\s*$/i,
                ""
            )
            .trim();


        /*
         * Some Census links can contain
         * hierarchy buttons such as 541,
         * 5415, 54151.
         *
         * Those are valid NAICS levels, so
         * we keep them.
         */


        if (
            title.length < 2
        ) {

            continue;

        }


        const key =
            code +
            "|" +
            title
            .toLowerCase();


        if (
            seen.has(key)
        ) {

            continue;

        }


        seen.add(key);


        results.push({

            code:
                code,

            title:
                title

        });

    }


    /*
     * Second parser.
     *
     * Census pages can sometimes render the
     * search result differently. Look for
     * explicit "Button:" style HTML text.
     */


    if (
        results.length === 0
    ) {


        const fallbackRegex =
            /(?:^|>)[\s\S]{0,100}?(\d{2,6})\s*[:\-]\s*([A-Za-z][^<]{2,150})(?:<|$)/gi;


        while (
            (match =
                fallbackRegex.exec(html)) !== null
        ) {


            const code =
                match[1];


            let title =
                match[2];


            title =
                cleanText(
                    decodeHtml(
                        title
                    )
                );


            if (
                code.length < 2 ||
                code.length > 6
            ) {

                continue;

            }


            if (
                title.length < 2
            ) {

                continue;

            }


            const key =
                code +
                "|" +
                title.toLowerCase();


            if (
                seen.has(key)
            ) {

                continue;

            }


            seen.add(key);


            results.push({

                code:
                    code,

                title:
                    title

            });

        }

    }


    return results;

}


/* =========================================
   STRIP HTML
========================================= */

function stripHtml(value) {


    return String(value || "")

        .replace(
            /<script[\s\S]*?<\/script>/gi,
            " "
        )

        .replace(
            /<style[\s\S]*?<\/style>/gi,
            " "
        )

        .replace(
            /<[^>]+>/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}


/* =========================================
   DECODE HTML
========================================= */

function decodeHtml(value) {


    return String(value || "")

        .replace(
            /&nbsp;/gi,
            " "
        )

        .replace(
            /&amp;/gi,
            "&"
        )

        .replace(
            /&quot;/gi,
            '"'
        )

        .replace(
            /&#039;/gi,
            "'"
        )

        .replace(
            /&#39;/gi,
            "'"
        )

        .replace(
            /&lt;/gi,
            "<"
        )

        .replace(
            /&gt;/gi,
            ">"
        );

}


/* =========================================
   CLEAN TEXT
========================================= */

function cleanText(value) {


    return String(value || "")

        .replace(
            /\s+/g,
            " "
        )

        .replace(
            /\s+([,.])/g,
            "$1"
        )

        .trim();

}


/* =========================================
   ESCAPE REGEX
========================================= */

function escapeRegex(value) {


    return String(value)

        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

}


/* =========================================
   JSON RESPONSE
========================================= */

function jsonResponse(data) {


    return new Response(

        JSON.stringify(data),

        {

            status: 200,

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
