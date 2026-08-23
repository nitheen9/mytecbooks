export async function onRequest(context) {

    const requestUrl =
        new URL(context.request.url);

    const originalQuery =
        requestUrl.searchParams.get("q") || "";

    const query =
        originalQuery.trim();

    if (query.length < 2) {

        return jsonResponse({
            query: query,
            results: []
        });
    }


    /*
     * IMPORTANT
     *
     * Census NAICS search accepts:
     *
     * https://www.census.gov/naics/?input=software&year=2022
     *
     * It also accepts 2-6 digit NAICS codes.
     *
     * We use the official Census NAICS search.
     */

    const searchUrl =
        "https://www.census.gov/naics/?input=" +
        encodeURIComponent(query) +
        "&year=2022";


    try {

        const response =
            await fetch(searchUrl, {

                headers: {

                    "User-Agent":
                        "Mozilla/5.0 (compatible; MyTecBooks NAICS Search)",

                    "Accept":
                        "text/html,application/xhtml+xml"

                }

            });


        if (!response.ok) {

            console.error(
                "Census NAICS HTTP status:",
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
            parseCensusResults(html);


        return jsonResponse({

            query: query,

            results:
                results.slice(0, 50)

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

    const seen = new Set();


    /*
     * Census result links normally contain:
     *
     * ?details=541511
     * ?details=513210
     *
     * We extract the code and the text
     * associated with the result.
     */


    const linkRegex =
        /<a[^>]+href=["']([^"']*naics\/\?details=(\d{2,6})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;


    let match;


    while (
        (match = linkRegex.exec(html)) !== null
    ) {

        const url =
            match[1];

        const code =
            match[2];

        let linkText =
            match[3];


        linkText =
            stripHtml(linkText);


        linkText =
            decodeHtml(linkText);


        linkText =
            cleanText(linkText);


        if (
            !code ||
            !linkText
        ) {

            continue;
        }


        /*
         * Remove common Census button text.
         */

        let title =
            linkText
                .replace(
                    /^Button\s+/i,
                    ""
                )
                .trim();


        /*
         * Sometimes Census includes the
         * comparable-industry marker.
         */

        title =
            title.replace(
                /\s*\^?T\s*$/i,
                ""
            ).trim();


        /*
         * If the result text contains:
         *
         * 541511 Custom Computer Programming Services
         *
         * remove the code from the title.
         */

        const codePrefix =
            new RegExp(
                "^" +
                escapeRegex(code) +
                "\\s+",
                "i"
            );


        title =
            title.replace(
                codePrefix,
                ""
            );


        /*
         * Remove extra definition text.
         *
         * Example:
         *
         * Software Publishers: This industry comprises...
         */

        const colonIndex =
            title.indexOf(":");


        if (
            colonIndex > 0 &&
            colonIndex < 150
        ) {

            title =
                title.substring(
                    0,
                    colonIndex
                ).trim();
        }


        /*
         * Clean title.
         */

        title =
            cleanText(title);


        if (
            !title ||
            title.length < 2
        ) {

            continue;
        }


        /*
         * Ignore navigation/search links.
         */

        if (
            /^(main|history|search results|reference files|downloadable files|go|search)$/i
            .test(title)
        ) {

            continue;
        }


        const key =
            code.toLowerCase() +
            "|" +
            title.toLowerCase();


        if (
            seen.has(key)
        ) {

            continue;
        }


        seen.add(key);


        results.push({

            code: code,

            title: title

        });
    }


    /*
     * SECOND PARSER
     *
     * Census HTML can change slightly.
     *
     * This parser catches links where the
     * details parameter is after other parameters.
     */

    const alternateRegex =
        /<a[^>]+href=["']([^"']*naics\/\?[^"']*details=(\d{2,6})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;


    while (
        (match = alternateRegex.exec(html)) !== null
    ) {

        const code =
            match[2];

        let title =
            stripHtml(match[3]);


        title =
            decodeHtml(title);


        title =
            cleanText(title);


        title =
            title.replace(
                /^Button\s+/i,
                ""
            ).trim();


        title =
            title.replace(
                /\s*\^?T\s*$/i,
                ""
            ).trim();


        const prefix =
            new RegExp(
                "^" +
                escapeRegex(code) +
                "\\s+",
                "i"
            );


        title =
            title.replace(
                prefix,
                ""
            );


        const colonIndex =
            title.indexOf(":");


        if (
            colonIndex > 0 &&
            colonIndex < 150
        ) {

            title =
                title.substring(
                    0,
                    colonIndex
                ).trim();
        }


        title =
            cleanText(title);


        if (
            !code ||
            !title ||
            title.length < 2
        ) {

            continue;
        }


        const key =
            code.toLowerCase() +
            "|" +
            title.toLowerCase();


        if (
            seen.has(key)
        ) {

            continue;
        }


        seen.add(key);


        results.push({

            code: code,

            title: title

        });
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
            /<noscript[\s\S]*?<\/noscript>/gi,
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
        )

        .replace(
            /&#(\d+);/g,
            function(match, dec) {

                return String.fromCharCode(
                    Number(dec)
                );
            }
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
