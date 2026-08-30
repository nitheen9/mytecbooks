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
            results: []
        });

    }

    /*
     * OFFICIAL 2022 NAICS SOURCE
     *
     * U.S. Bureau of Labor Statistics
     * QCEW NAICS 2022 Industry Crosswalk
     *
     * This page contains the complete
     * 2022 six-digit NAICS hierarchy.
     */

    const sourceUrl =
        "https://www.bls.gov/cew/classifications/industry/qcew-naics-hierarchy-crosswalk.htm";

    try {

        const response =
            await fetch(
                sourceUrl,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS Search)",
                        "Accept":
                            "text/html"
                    }
                }
            );

        if (!response.ok) {

            console.error(
                "BLS HTTP status:",
                response.status
            );

            return jsonResponse({
                query: query,
                results: []
            });

        }

        const html =
            await response.text();

        const records =
            parseBLS2022Table(html);

        /*
         * Search only the 2022 records.
         *
         * Exact code:
         * 513210
         *
         * Keyword:
         * software
         */

        let results;

        if (/^\d{2,6}$/.test(query)) {

            results =
                records.filter(
                    function(item) {

                        return (
                            item.code === query ||
                            item.code.startsWith(query)
                        );

                    }
                );

        }
        else {

            const words =
                query
                .split(/\s+/)
                .filter(Boolean);

            results =
                records.filter(
                    function(item) {

                        const haystack =
                            (
                                item.code +
                                " " +
                                item.title
                            )
                            .toLowerCase();

                        return words.every(
                            function(word) {

                                return haystack.includes(
                                    word
                                );

                            }
                        );

                    }
                );

        }

        /*
         * Keep a maximum of 50 results.
         */

        results =
            results.slice(
                0,
                50
            );


        return jsonResponse({

            query: query,

            year: 2022,

            results: results

        });

    }
    catch (error) {

        console.error(
            "2022 NAICS search error:",
            error
        );

        return jsonResponse({

            query: query,

            year: 2022,

            results: []

        });

    }
}


/* =========================================
   PARSE BLS 2022 TABLE
========================================= */

function parseBLS2022Table(html) {

    const results = [];

    const seen =
        new Set();

    /*
     * Find all table rows.
     */

    const rowRegex =
        /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

    let rowMatch;

    while (
        (rowMatch = rowRegex.exec(html)) !== null
    ) {

        const rowHtml =
            rowMatch[1];

        /*
         * Extract cells.
         */

        const cells = [];

        const cellRegex =
            /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;

        let cellMatch;

        while (
            (cellMatch =
                cellRegex.exec(rowHtml)) !== null
        ) {

            cells.push(
                cleanCell(
                    cellMatch[1]
                )
            );

        }

        /*
         * BLS 2022 table format:
         *
         * 0 = naics6_code
         * 1 = naics6_title
         * 2 = naics5_code
         * 3 = naics5_title
         * 4 = naics4_code
         * 5 = naics4_title
         */

        if (
            cells.length < 6
        ) {
            continue;
        }

        const code =
            cells[0];

        const title =
            cells[1];

        if (
            !/^\d{6}$/.test(code)
        ) {
            continue;
        }

        if (
            !title ||
            title.length < 2
        ) {
            continue;
        }

        /*
         * Avoid duplicate entries.
         */

        if (
            seen.has(code)
        ) {
            continue;
        }

        seen.add(code);

        results.push({

            code: code,

            title: title,

            year: 2022

        });

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

    return results;
}


/* =========================================
   CLEAN CELL
========================================= */

function cleanCell(value) {

    return decodeHtml(
        String(value || "")

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

            .trim()
    );
}


/* =========================================
   HTML ENTITY DECODE
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
