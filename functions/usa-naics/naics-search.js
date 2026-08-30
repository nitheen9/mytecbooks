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

        return jsonResponse({

            query: query,

            results: []

        });

    }


    /*
     * IMPORTANT
     *
     * Do NOT send:
     *
     * details=software
     *
     * because Census interprets "details"
     * as a NAICS code/detail selection.
     *
     * For text searches we use ONLY:
     *
     * input=query
     * year=2022
     */

    const searchUrl =
        "https://www.census.gov/naics/" +
        "?input=" +
        encodeURIComponent(query) +
        "&year=2022";


    try {

        const response =
            await fetch(
                searchUrl,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS Search)",

                        "Accept":
                            "text/html,application/xhtml+xml,text/html"

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


        /*
         * Remove anything that isn't
         * a real 2-6 digit NAICS code.
         */

        const filtered =
            results.filter(
                function(item) {

                    return (
                        /^\d{2,6}$/.test(
                            item.code
                        ) &&
                        item.title &&
                        item.title.length >= 2
                    );

                }
            );


        return jsonResponse({

            query: query,

            results:
                filtered.slice(0, 50)

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
   PARSE CENSUS SEARCH RESULTS
========================================= */

function parseCensusResults(html) {

    const results = [];

    const seen = new Set();


    /*
     * Census search result buttons
     * look like:
     *
     * Button: 513210
     *
     * followed by:
     *
     * Software Publishers
     *
     * We extract actual 2-6 digit
     * codes only.
     */


    /*
     * METHOD 1
     *
     * Look for:
     *
     * Button: 513210
     * Software Publishers
     */

    const buttonRegex =
        /Button:\s*(\d{2,6})\s+([^:]{2,180}?)(?::\s*(?:This industry comprises|See industry description)|\s+(?:This industry comprises|See industry description))/gi;


    let match;


    while (
        (match = buttonRegex.exec(html)) !== null
    ) {

        const code =
            match[1];

        let title =
            match[2];


        title =
            stripHtml(title);


        title =
            decodeHtml(title);


        title =
            cleanTitle(title);


        addResult(
            results,
            seen,
            code,
            title
        );

    }


    /*
     * METHOD 2
     *
     * Find Census links containing:
     *
     * details=513210
     *
     */

    const linkRegex =
        /href=["'][^"']*?[?&]details=(\d{2,6})[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;


    while (
        (match = linkRegex.exec(html)) !== null
    ) {

        const code =
            match[1];

        let title =
            match[2];


        title =
            stripHtml(title);


        title =
            decodeHtml(title);


        title =
            cleanTitle(title);


        /*
         * Ignore generic navigation.
         */

        if (
            !title ||
            /^(main|home|search|menu|next|previous|history|concordances|downloadable files)$/i
                .test(title)
        ) {

            continue;

        }


        /*
         * Remove "Button:" if it survived.
         */

        title =
            title.replace(
                /^Button:\s*\d{2,6}\s*/i,
                ""
            );


        addResult(
            results,
            seen,
            code,
            title
        );

    }


    /*
     * METHOD 3
     *
     * Census sometimes represents
     * the result as:
     *
     * [Button: 513210] Software Publishers
     *
     */

    const bracketRegex =
        /\[Button:\s*(\d{2,6})\]\s*([^.;]{2,180})/gi;


    while (
        (match = bracketRegex.exec(html)) !== null
    ) {

        const code =
            match[1];

        let title =
            match[2];


        title =
            stripHtml(title);


        title =
            decodeHtml(title);


        title =
            cleanTitle(title);


        addResult(
            results,
            seen,
            code,
            title
        );

    }


    return results;

}


/* =========================================
   ADD RESULT
========================================= */

function addResult(
    results,
    seen,
    code,
    title
) {

    if (
        !/^\d{2,6}$/.test(code)
    ) {

        return;

    }


    if (!title) {

        return;

    }


    /*
     * Remove Census footnote marker.
     */

    title =
        title
        .replace(
            /[†‡*]+$/g,
            ""
        )
        .trim();


    /*
     * Remove leading punctuation.
     */

    title =
        title
        .replace(
            /^[\s:–—-]+/,
            ""
        )
        .trim();


    /*
     * Don't allow navigation
     * words to become results.
     */

    if (
        /^(NAICS|search results|search|home|main|menu|history|concordances|downloadable files|reference files|announcements)$/i
            .test(title)
    ) {

        return;

    }


    if (
        title.length < 2
    ) {

        return;

    }


    const key =
        code +
        "|" +
        title.toLowerCase();


    if (
        seen.has(key)
    ) {

        return;

    }


    seen.add(key);


    results.push({

        code:
            code,

        title:
            title

    });

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
   CLEAN TITLE
========================================= */

function cleanTitle(value) {

    return String(value || "")

        .replace(
            /\s+/g,
            " "
        )

        .replace(
            /\s+([,.])/g,
            "$1"
        )

        .replace(
            /\s*T\s*$/i,
            ""
        )

        .trim();

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
