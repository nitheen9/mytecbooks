export async function onRequest(context) {

    const code =
        String(context.params.code || "").trim();

    if (!/^\d{2,6}$/.test(code)) {

        return notFound(
            "Invalid U.S. NAICS code."
        );

    }

    try {

        /*
         * Ask the official Census NAICS
         * search page for this exact code.
         *
         * Current official classification:
         * 2022 U.S. NAICS
         */

        const censusUrl =
            "https://www.census.gov/naics/" +
            "?input=" +
            encodeURIComponent(code) +
            "&year=2022" +
            "&details=" +
            encodeURIComponent(code);

        const response =
            await fetch(
                censusUrl,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS)",
                        "Accept":
                            "text/html,application/xhtml+xml,text/html"
                    }
                }
            );

        if (!response.ok) {

            return notFound(
                "U.S. NAICS code " +
                code +
                " was not found in the 2022 NAICS classification."
            );

        }

        const html =
            await response.text();

        const data =
            extractNAICS(
                html,
                code
            );

        if (!data) {

            return notFound(
                "U.S. NAICS code " +
                code +
                " was not found in the 2022 NAICS classification."
            );

        }

        return new Response(
            createPage(data),
            {
                status: 200,

                headers: {
                    "Content-Type":
                        "text/html; charset=UTF-8",

                    "Cache-Control":
                        "public, max-age=86400, s-maxage=604800"
                }
            }
        );

    }
    catch (error) {

        console.error(
            "NAICS detail error:",
            error
        );

        return new Response(
            "Unable to load U.S. NAICS information.",
            {
                status: 500,

                headers: {
                    "Content-Type":
                        "text/plain; charset=UTF-8"
                }
            }
        );

    }
}


/* =========================================
   EXTRACT NAICS INFORMATION
========================================= */

function extractNAICS(
    html,
    requestedCode
) {

    /*
     * First verify Census explicitly says
     * the code is invalid.
     */

    const invalidRegex =
        new RegExp(
            escapeRegex(requestedCode) +
            "\\s+is not a valid 2022 NAICS code",
            "i"
        );

    if (
        invalidRegex.test(
            decodeHtml(
                stripHtml(html)
            )
        )
    ) {

        return null;

    }


    /*
     * Census search result normally contains:
     *
     * Button: 513140
     * Directory and Mailing List Publishers
     *
     * followed by:
     *
     * This industry comprises...
     */

    const buttonRegex =
        new RegExp(
            "(?:Button:\\s*|button\\s*[:\\-]?\\s*)" +
            escapeRegex(requestedCode) +
            "\\s*" +
            "([^<\\n]{2,300})",
            "i"
        );

    const buttonMatch =
        html.match(
            buttonRegex
        );


    /*
     * Alternative HTML form:
     *
     * <a ...>513140 ...</a>
     */

    let description = "";

    if (buttonMatch) {

        description =
            cleanDescription(
                decodeHtml(
                    stripHtml(
                        buttonMatch[1]
                    )
                )
            );

    }


    /*
     * Exact anchor search.
     */

    if (!description) {

        const anchorRegex =
            new RegExp(
                "<a[^>]*>\\s*" +
                escapeRegex(requestedCode) +
                "\\s*</a>\\s*([^<]+)",
                "i"
            );

        const anchorMatch =
            html.match(
                anchorRegex
            );

        if (anchorMatch) {

            description =
                cleanDescription(
                    decodeHtml(
                        anchorMatch[1]
                    )
                );

        }

    }


    /*
     * Search the rendered text.
     */

    const text =
        cleanText(
            decodeHtml(
                stripHtml(html)
            )
        );


    /*
     * Exact code followed by title.
     */

    if (!description) {

        const textRegex =
            new RegExp(
                "(?:^|\\s)" +
                escapeRegex(requestedCode) +
                "\\s+" +
                "([A-Z][A-Za-z0-9 ,&()'\\/\\.\\-]{2,250}?)" +
                "(?=\\s+This industry comprises|" +
                "\\s+See industry description|" +
                "\\s+Cross-References|" +
                "\\s+Illustrative Examples|" +
                "\\s+2022 NAICS Definition|$)",
                "i"
            );

        const textMatch =
            text.match(
                textRegex
            );

        if (textMatch) {

            description =
                cleanDescription(
                    textMatch[1]
                );

        }

    }


    if (!description) {

        return null;

    }


    /*
     * Industry details.
     */

    let details =
        "";

    const detailsRegex =
        /This industry comprises\s+(.+?)(?=\s+Cross-References|\s+Illustrative Examples|\s+2022 NAICS Definition|\s+2022 NAICS Manual|$)/i;

    const detailsMatch =
        text.match(
            detailsRegex
        );

    if (detailsMatch) {

        details =
            cleanText(
                "This industry comprises " +
                detailsMatch[1]
            );

    }


    /*
     * Sector.
     */

    let sector =
        "Not available";

    const sectorRegex =
        /Sector\s+(\d{2})\s*[—-]\s*([A-Za-z0-9 ,&()'\/.\-]+?)(?=\s+The Sector|\s+\d{2,6}\s|$)/i;

    const sectorMatch =
        text.match(
            sectorRegex
        );

    if (sectorMatch) {

        sector =
            cleanText(
                sectorMatch[1] +
                " — " +
                sectorMatch[2]
            );

    }


    /*
     * Industry group.
     */

    let industryGroup =
        "Not available";

    const groupRegex =
        /(\d{4})\s+([A-Z][A-Za-z0-9 ,&()'\/.\-]+?)(?=\s+This industry comprises|\s+See industry description|\s+\d{5,6}\s|$)/;

    const groupMatch =
        text.match(
            groupRegex
        );

    if (
        groupMatch &&
        groupMatch[1] !== requestedCode
    ) {

        industryGroup =
            cleanText(
                groupMatch[1] +
                " — " +
                groupMatch[2]
            );

    }


    return {

        code:
            requestedCode,

        description:
            description,

        sector:
            sector,

        industryGroup:
            industryGroup,

        details:
            details ||
            "See the official U.S. Census Bureau 2022 NAICS classification for the complete industry description."

    };

}


/* =========================================
   DESCRIPTION CLEANING
========================================= */

function cleanDescription(value) {

    let result =
        cleanText(value);

    result =
        result
        .replace(
            /\s+This industry comprises.*$/i,
            ""
        )
        .replace(
            /\s+See industry description.*$/i,
            ""
        )
        .replace(
            /\s+Cross-References.*$/i,
            ""
        )
        .replace(
            /\s+Illustrative Examples.*$/i,
            ""
        )
        .replace(
            /\s+2022 NAICS Definition.*$/i,
            ""
        )
        .replace(
            /[†‡*]+$/g,
            ""
        );

    return result.trim();

}


/* =========================================
   CREATE HTML PAGE
========================================= */

function createPage(data) {

    const code =
        escapeHtml(
            data.code
        );

    const description =
        escapeHtml(
            data.description
        );

    const sector =
        escapeHtml(
            data.sector
        );

    const industryGroup =
        escapeHtml(
            data.industryGroup
        );

    const details =
        escapeHtml(
            data.details
        );

    const title =
        data.code +
        " - " +
        data.description +
        " | U.S. NAICS Code";

    const metaDescription =
        "U.S. NAICS Code " +
        data.code +
        ": " +
        data.description +
        ". 2022 U.S. NAICS industry classification and details.";

    const censusUrl =
        "https://www.census.gov/naics/" +
        "?details=" +
        encodeURIComponent(data.code) +
        "&input=" +
        encodeURIComponent(data.code) +
        "&year=2022";


    return `<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<meta name="robots"
      content="index, follow">

<meta name="description"
      content="${escapeHtml(metaDescription)}">

<link rel="icon"
      type="image/png"
      href="/favicon.png">

<title>${escapeHtml(title)}</title>

<style>

:root {
    --primary: #f48120;
    --dark: #1e1e24;
    --light: #f9f9fb;
    --border: #e0e0e6;
}

* {
    box-sizing: border-box;
}

body {

    margin: 0;
    padding: 20px;

    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;

    background:
        var(--light);

    color:
        var(--dark);
}

.container {

    max-width:
        850px;

    margin:
        0 auto;
}

h1 {

    text-align:
        center;

    margin:
        10px 0 12px;

    font-size:
        30px;
}

.subtitle {

    text-align:
        center;

    color:
        #666;

    line-height:
        1.6;

    margin-bottom:
        25px;
}

.card {

    background:
        white;

    padding:
        28px;

    border-radius:
        12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.06);

    border-top:
        5px solid
        var(--primary);
}

.card h2 {

    margin-top:
        0;

    color:
        #333;
}

.data-row {

    padding:
        15px 0;

    border-bottom:
        1px solid
        var(--border);

    line-height:
        1.7;
}

.data-row:last-child {

    border-bottom:
        none;
}

.label {

    font-weight:
        700;

    display:
        block;

    margin-bottom:
        4px;
}

.code {

    display:
        inline-block;

    background:
        var(--dark);

    color:
        white;

    padding:
        7px 12px;

    border-radius:
        6px;

    font-weight:
        700;

    letter-spacing:
        1px;
}

.source {

    margin-top:
        25px;

    padding:
        15px;

    background:
        #fff8ef;

    border-radius:
        8px;

    line-height:
        1.6;

    font-size:
        14px;
}

.source a {

    color:
        #b85c00;

    font-weight:
        700;
}

.back {

    display:
        inline-block;

    margin-top:
        25px;

    padding:
        12px 18px;

    background:
        var(--dark);

    color:
        white;

    text-decoration:
        none;

    border-radius:
        7px;

    font-weight:
        700;
}

footer {

    text-align:
        center;

    color:
        #777;

    font-size:
        13px;

    margin:
        30px 0 10px;

    line-height:
        1.6;
}

@media(max-width:600px) {

    body {
        padding: 12px;
    }

    h1 {
        font-size: 24px;
    }

    .card {
        padding: 18px;
    }

}

</style>

</head>

<body>

<div class="container">

<h1>
🇺🇸 U.S. NAICS Code ${code}
</h1>

<p class="subtitle">

2022 North American Industry Classification System:
<strong>${description}</strong>

</p>

<div class="card">

<h2>
🏭 NAICS ${code} — ${description}
</h2>

<div class="data-row">

<span class="label">
NAICS Code
</span>

<span class="code">
${code}
</span>

</div>

<div class="data-row">

<span class="label">
Industry Description
</span>

${description}

</div>

<div class="data-row">

<span class="label">
Sector
</span>

${sector}

</div>

<div class="data-row">

<span class="label">
Industry Group
</span>

${industryGroup}

</div>

<div class="data-row">

<span class="label">
Industry Details
</span>

${details}

</div>

<div class="source">

<strong>
Official Source:
</strong>

<br>

U.S. Census Bureau —
2022 North American Industry Classification System.

<br><br>

<a
href="${censusUrl}"
target="_blank"
rel="noopener noreferrer">

View NAICS ${code} on U.S. Census Bureau →

</a>

</div>

<a
class="back"
href="/usa-naics-search.html">

← U.S. NAICS Code Search

</a>

</div>

<footer>

U.S. NAICS Code Search<br>

2022 North American Industry Classification System<br>

Source: U.S. Census Bureau

</footer>

</div>

</body>

</html>`;

}


/* =========================================
   NOT FOUND
========================================= */

function notFound(message) {

    return new Response(

        `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<meta name="robots"
      content="noindex, follow">

<title>
U.S. NAICS Code Not Found
</title>

<style>

body {

    font-family:
        Arial,
        sans-serif;

    background:
        #f9f9fb;

    padding:
        40px 20px;

    text-align:
        center;
}

.box {

    max-width:
        650px;

    margin:
        auto;

    background:
        white;

    padding:
        30px;

    border-radius:
        12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.08);
}

h1 {
    color:
        #1e1e24;
}

a {

    display:
        inline-block;

    margin-top:
        20px;

    padding:
        12px 18px;

    background:
        #f48120;

    color:
        white;

    text-decoration:
        none;

    border-radius:
        7px;

    font-weight:
        bold;
}

</style>

</head>

<body>

<div class="box">

<h1>
🇺🇸 U.S. NAICS Code Not Found
</h1>

<p>
${escapeHtml(message)}
</p>

<a href="/usa-naics-search.html">
← U.S. NAICS Code Search
</a>

</div>

</body>

</html>`,

        {
            status: 404,

            headers: {
                "Content-Type":
                    "text/html; charset=UTF-8"
            }
        }
    );

}


/* =========================================
   HTML STRIP
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
   HTML DECODE
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
   TEXT CLEAN
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
   REGEX ESCAPE
========================================= */

function escapeRegex(value) {

    return String(value)
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}
