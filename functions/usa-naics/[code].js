export async function onRequest(context) {

    const code =
        String(
            context.params.code || ""
        ).trim();


    /*
     * U.S. NAICS:
     *
     * 2 to 6 digits
     */

    if (
        !/^\d{2,6}$/.test(code)
    ) {

        return notFound(
            "Invalid U.S. NAICS code. Please use a 2 to 6 digit NAICS code."
        );

    }


    /*
     * IMPORTANT:
     *
     * These are NAICS revision years,
     * NOT NAICS codes.
     *
     * This prevents:
     *
     * /usa-naics/2002/
     *
     * from being treated as a code.
     */

    const revisionYears =
        new Set([
            "1997",
            "2002",
            "2007",
            "2012",
            "2017",
            "2022"
        ]);


    if (
        revisionYears.has(code)
    ) {

        return notFound(
            "The URL /usa-naics/" +
            code +
            "/ is a NAICS revision year, not a NAICS code."
        );

    }


    try {

        /*
         * Official U.S. Census NAICS page.
         */

        const url =
            "https://www.census.gov/naics/" +
            "?details=" +
            encodeURIComponent(code) +
            "&input=" +
            encodeURIComponent(code) +
            "&year=2022";


        const response =
            await fetch(
                url,
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

            return notFound(
                "U.S. NAICS code " +
                code +
                " was not found in the 2022 NAICS classification."
            );

        }


        const html =
            await response.text();


        const data =
            parseNAICSPage(
                html,
                code
            );


        if (
            !data.description
        ) {

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
            "NAICS error:",
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
   PARSE CENSUS PAGE
========================================= */

function parseNAICSPage(
    html,
    requestedCode
) {

    const result = {

        code:
            requestedCode,

        description:
            "",

        sector:
            "",

        industryGroup:
            "",

        definition:
            ""

    };


    /*
     * Find the exact NAICS code followed
     * by its title.
     *
     * Census HTML can change slightly,
     * so several patterns are attempted.
     */


    const exactPatterns = [

        new RegExp(
            "\\b" +
            requestedCode +
            "\\s*[:\\-]\\s*([^<]{2,150})",
            "i"
        ),

        new RegExp(
            ">" +
            requestedCode +
            "<[^>]*>\\s*([^<]{2,150})",
            "i"
        ),

        new RegExp(
            "\\b" +
            requestedCode +
            "\\s+([A-Z][A-Za-z0-9,&'()\\/\\.\\- ]{2,150})",
            "i"
        )

    ];


    for (
        const regex of exactPatterns
    ) {

        const match =
            html.match(regex);


        if (
            match &&
            match[1]
        ) {

            const title =
                cleanTitle(
                    stripHtml(
                        decodeHtml(
                            match[1]
                        )
                    )
                );


            if (
                title &&
                !isBadTitle(title)
            ) {

                result.description =
                    title;

                break;

            }

        }

    }


    /*
     * Parse readable page text.
     */

    const text =
        cleanText(
            decodeHtml(
                stripHtml(html)
            )
        );


    /*
     * If exact title was not found,
     * look in readable text.
     */

    if (
        !result.description
    ) {

        const regex =
            new RegExp(
                "\\b" +
                requestedCode +
                "\\s*:?\\s+([A-Z][A-Za-z0-9,&'()\\/\\.\\- ]{2,150}?)(?=\\s+This\\s+(?:U\\.S\\.\\s+)?industry|\\s+This industry|\\s+Cross-References|\\s+Illustrative Examples|\\s+NAICS Definition|$)",
                "i"
            );


        const match =
            text.match(regex);


        if (
            match
        ) {

            result.description =
                cleanTitle(
                    match[1]
                );

        }

    }


    /*
     * Sector
     *
     * Example:
     *
     * Sector 54--Professional,
     * Scientific, and Technical Services
     */

    const sectorMatch =
        text.match(
            /Sector\s+(\d{2})\s*[—-]\s*([^]+?)(?=\s+\d{2,6}\s+[A-Z]|\s+Industry Group|\s+NAICS Definition)/i
        );


    if (
        sectorMatch
    ) {

        result.sector =
            cleanText(
                sectorMatch[1] +
                ": " +
                sectorMatch[2]
            );

    }


    /*
     * Industry group.
     *
     * Example:
     *
     * 5415 Computer Systems Design
     * and Related Services
     */

    const groupRegex =
        new RegExp(
            "\\b(" +
            requestedCode.substring(
                0,
                Math.min(
                    5,
                    requestedCode.length
                )
            ) +
            "\\d{0,3})\\s+([A-Z][A-Za-z0-9,&'()\\/\\.\\- ]{3,150})",
            "i"
        );


    const groupMatch =
        text.match(
            groupRegex
        );


    if (
        groupMatch &&
        groupMatch[2]
    ) {

        const groupTitle =
            cleanTitle(
                groupMatch[2]
            );


        if (
            groupTitle &&
            groupTitle.length < 150
        ) {

            result.industryGroup =
                groupMatch[1] +
                ": " +
                groupTitle;

        }

    }


    /*
     * Definition.
     *
     * Example:
     *
     * This U.S. industry comprises establishments...
     */

    const definitionMatch =
        text.match(
            /This\s+(?:U\.S\.\s+)?industry\s+comprises\s+(.+?)(?=\s+Cross-References|\s+Illustrative Examples|\s+NAICS Definition|\s+T\s*=\s*Canadian|$)/i
        );


    if (
        definitionMatch
    ) {

        result.definition =
            cleanText(
                "This U.S. industry comprises " +
                definitionMatch[1]
            );

    }


    /*
     * Another Census wording.
     */

    if (
        !result.definition
    ) {

        const definitionMatch2 =
            text.match(
                /This industry comprises\s+(.+?)(?=\s+Cross-References|\s+Illustrative Examples|\s+NAICS Definition|$)/i
            );


        if (
            definitionMatch2
        ) {

            result.definition =
                cleanText(
                    "This industry comprises " +
                    definitionMatch2[1]
                );

            }

    }


    return result;

}


/* =========================================
   CLEAN TITLE
========================================= */

function cleanTitle(value) {

    let valueText =
        String(value || "")
        .replace(
            /\s+/g,
            " "
        )
        .trim();


    valueText =
        valueText.replace(
            /^\d{2,6}\s*[:\-]\s*/,
            ""
        );


    valueText =
        valueText.replace(
            /\s*\^T\s*$/i,
            ""
        );


    const stopWords = [

        "This U.S. industry comprises",

        "This industry comprises",

        "Illustrative Examples:",

        "Cross-References.",

        "Cross-References",

        "NAICS Definition"

    ];


    for (
        const word of stopWords
    ) {

        const index =
            valueText
            .toLowerCase()
            .indexOf(
                word.toLowerCase()
            );


        if (
            index >= 0
        ) {

            valueText =
                valueText.substring(
                    0,
                    index
                );

        }

    }


    return valueText.trim();

}


/* =========================================
   BAD TITLE
========================================= */

function isBadTitle(value) {

    const title =
        String(value || "")
        .trim();


    if (
        !title ||
        title.length < 2
    ) {

        return true;

    }


    if (
        /^(NAICS|Search|Go|Menu|Main|History|Concordances|Downloadable Files)$/i
            .test(title)
    ) {

        return true;

    }


    return false;

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
   PAGE
========================================= */

function createPage(data) {

    const code =
        escapeHtml(data.code);

    const description =
        escapeHtml(data.description);

    const sector =
        escapeHtml(
            data.sector ||
            "Not available"
        );

    const industryGroup =
        escapeHtml(
            data.industryGroup ||
            "Not available"
        );

    const definition =
        escapeHtml(
            data.definition ||
            "See the official U.S. Census Bureau NAICS classification for the complete industry description."
        );


    const title =
        `${data.code} - ${data.description} | U.S. NAICS Code`;


    const metaDescription =
        `U.S. NAICS Code ${data.code}: ${data.description}. View industry classification, sector, industry group and detailed information.`;


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

<title>
${escapeHtml(title)}
</title>


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

    color:
        #333;

    margin-top:
        0;

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

.section {

    margin-top:
        25px;

    padding:
        20px;

    background:
        #f5f5f8;

    border-left:
        5px solid
        var(--primary);

    border-radius:
        8px;

}

.section h2 {

    margin-top:
        0;

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

North American Industry Classification System:
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


<div class="section">

<h2>
Industry Definition
</h2>

${definition}

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
href="https://www.census.gov/naics/?details=${encodeURIComponent(data.code)}&input=${encodeURIComponent(data.code)}&year=2022"
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

Classification information is based on the
2022 U.S. Census Bureau NAICS classification.

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
   ESCAPE HTML
========================================= */

function escapeHtml(value) {

    return String(value ?? "")

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
