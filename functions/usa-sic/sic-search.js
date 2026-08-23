export async function onRequest(context) {

    const requestUrl = new URL(context.request.url);

    const query =
        (requestUrl.searchParams.get("q") || "")
        .trim();

    if (query.length < 2) {

        return jsonResponse({
            results: []
        });

    }

    try {

        /*
         * OSHA SIC keyword search
         *
         * Example:
         * https://www.osha.gov/data/sic-search?title_and_body=rice
         */

        const searchUrl =
            "https://www.osha.gov/data/sic-search?title_and_body=" +
            encodeURIComponent(query);

        const response = await fetch(searchUrl, {

            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; MyTecBooks SIC Search)"
            }

        });

        if (!response.ok) {

            console.error(
                "OSHA HTTP status:",
                response.status
            );

            return jsonResponse({
                results: []
            });

        }

        const html =
            await response.text();

        const results =
            parseOSHAResults(html);

        return jsonResponse({

            query: query,

            results: results.slice(0, 50)

        });

    }
    catch (error) {

        console.error(
            "SIC search error:",
            error
        );

        return jsonResponse({
            results: []
        });

    }

}


/* =========================================
   PARSE OSHA SEARCH RESULTS
========================================= */

function parseOSHAResults(html) {

    const results = [];

    const seen = new Set();


    /*
     * OSHA search result links look like:
     *
     * /data/sic-manual/0112
     *
     * or similar SIC manual links.
     *
     * We therefore look for any OSHA link
     * containing a 2-4 digit SIC code.
     */

    const patterns = [

        /href=["']([^"']*sic[^"']*\/(\d{2,4})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,

        /href=["']([^"']*\/(\d{2,4})[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi

    ];


    for (
        const regex of patterns
    ) {

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
             * OSHA search result text can be:
             *
             * Description for 0112: Rice
             */

            let title =
                linkText;


            const descriptionMatch =
                linkText.match(
                    /Description\s+for\s+\d{2,4}\s*:\s*(.+)/i
                );


            if (descriptionMatch) {

                title =
                    descriptionMatch[1];

            }


            title =
                cleanText(title);


            if (
                !title ||
                title.length < 2
            ) {

                continue;

            }


            /*
             * Ignore navigation links that happen
             * to contain numbers.
             */

            if (
                /^(search|submit|clear|next|previous)$/i.test(title)
            ) {

                continue;

            }


            const key =
                code + "|" + title;


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
   DECODE HTML ENTITIES
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
