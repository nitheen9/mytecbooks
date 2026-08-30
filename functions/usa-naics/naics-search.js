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


    /*
     * CURRENT ADOPTED U.S. NAICS:
     *
     * 2022 only.
     *
     * Do NOT use the old 2017/2012/2007
     * Census search pages.
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


        const text =
            htmlToText(html);


        const results =
            parseSearchResults(text);


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
   PARSE CENSUS SEARCH RESULTS
========================================= */

function parseSearchResults(text) {

    const results = [];

    const seen =
        new Set();


    /*
     * Current Census pages contain entries
     * similar to:
     *
     * Button: 513210
     * Software Publishers:
     *
     * or:
     *
     * Button: 541511
     * Custom Computer Programming Services:
     *
     * We extract only numeric NAICS codes.
     */

    const regex =
        /\[?\s*Button:\s*(\d{2,6})\s*\]?\s+([^:]+?)(?=\s*:\s*This\s+(?:U\.S\.\s+)?industry|\s*:\s*See industry description|\s+This\s+(?:U\.S\.\s+)?industry|\s+See industry description|$)/gi;


    let match;


    while (
        (match = regex.exec(text)) !== null
    ) {

        const code =
            match[1].trim();

        let title =
            match[2].trim();


        if (
            !/^\d{2,6}$/.test(code)
        ) {
            continue;
        }


        title =
            cleanTitle(title);


        if (
            !title ||
            title.length < 2
        ) {
            continue;
        }


        /*
         * Do not allow year numbers to become
         * NAICS results.
         */

        if (
            /^(1997|2002|2007|2012|2017|2022)$/
            .test(code)
        ) {
            continue;
        }


        const key =
            code + "|" + title.toLowerCase();


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
     * Fallback parser.
     *
     * Some Census responses can omit the
     * literal [Button: ...] brackets after
     * server-side rendering.
     */

    if (
        results.length === 0
    ) {

        const fallbackRegex =
            /Button:\s*(\d{2,6})\s+([A-Za-z][^:\n]{1,150})(?::|(?=\s+This industry))/gi;


        while (
            (match = fallbackRegex.exec(text)) !== null
        ) {

            const code =
                match[1].trim();

            let title =
                cleanTitle(match[2]);


            if (
                !/^\d{2,6}$/.test(code)
            ) {
                continue;
            }


            if (
                /^(1997|2002|2007|2012|2017|2022)$/
                .test(code)
            ) {
                continue;
            }


            if (
                !title
            ) {
                continue;
            }


            const key =
                code + "|" + title.toLowerCase();


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

    }


    return results;
}


/* =========================================
   HTML -> TEXT
========================================= */

function htmlToText(html) {

    return String(html || "")

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
            /<svg[\s\S]*?<\/svg>/gi,
            " "
        )

        .replace(
            /<[^>]+>/g,
            " "
        )

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
            /\s+/g,
            " "
        )

        .trim();
}


/* =========================================
   CLEAN TITLE
========================================= */

function cleanTitle(value) {

    return String(value || "")

        .replace(
            /[†‡*]+/g,
            ""
        )

        .replace(
            /\s+/g,
            " "
        )

        .replace(
            /\s+$/,
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
