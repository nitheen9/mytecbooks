export async function onRequest(context) {

    const { code } =
        context.params;


    if (!code) {

        return notFound(
            "NAICS code was not provided."
        );

    }


    const naicsCode =
        String(code)
            .trim();


    /*
     * 2022 U.S. NAICS codes:
     *
     * 2 to 6 digits.
     */

    if (
        !/^\d{2,6}$/.test(
            naicsCode
        )
    ) {

        return notFound(
            "Invalid U.S. NAICS code. Please use a 2 to 6 digit NAICS code."
        );

    }


    try {

        /*
         * Official U.S. Census Bureau
         * 2022 NAICS search page.
         */

        const url =
            "https://www.census.gov/naics/?" +
            "details=" +
            encodeURIComponent(naicsCode) +
            "&input=" +
            encodeURIComponent(naicsCode) +
            "&year=2022";


        const response =
            await fetch(
                url,
                {
                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (compatible; MyTecBooks NAICS)"

                    }
                }
            );


        if (!response.ok) {

            return notFound(
                "U.S. NAICS code " +
                naicsCode +
                " was not found."
            );

        }


        const html =
            await response.text();


        const data =
            parseNAICSPage(
                html,
                naicsCode
            );


        if (
            !data.description
        ) {

            return notFound(
                "U.S. NAICS code " +
                naicsCode +
                " was not found in the 2022 U.S. NAICS classification."
            );

        }


        return new Response(

            createPage(data),

            {

                status:
                    200,

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

                status:
                    500,

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

    const text =
        cleanText(
            decodeHtml(
                stripHtml(html)
            )
        );


    let description =
        "";


    /*
     * Search for:
     *
     * 541511 | 541511 | 541511 |
     * Custom Computer Programming Services
     */

    const patterns = [

        new RegExp(
            "\\b" +
            requestedCode +
            "\\b\\s*\\|\\s*" +
            requestedCode +
            "\\b\\s*\\|\\s*" +
            requestedCode +
            "\\b\\s*\\|\\s*([^|]+)",
            "i"
        ),

        new RegExp(
            "\\b" +
            requestedCode +
            "\\b\\s*[-:]\\s*([^|]+)",
            "i"
        ),

        new RegExp(
            "\\b" +
            requestedCode +
            "\\b\\s+([A-Za-z][^|]{2,250})",
            "i"
        )

    ];


    for (
        const regex of patterns
    ) {

        const match =
            text.match(regex);


        if (match) {

            description =
                cleanDescription(
                    match[1]
                );


            if (description) {
                break;
            }

        }

    }


    /*
     * Remove obvious invalid messages.
     */

    if (
        /is not a valid 2022 NAICS code/i.test(
            text
        )
    ) {

        description =
            "";

    }


    return {

        code:
            requestedCode,

        description:
            description

    };

}


/* =========================================
   CREATE PAGE
========================================= */

function createPage(
    data
) {

    const code =
        escapeHtml(
            data.code
        );


    const description =
        escapeHtml(
            data.description
        );


    const title =
        `${data.code} - ${data.description} | U.S. NAICS Code`;


    const metaDescription =
        `U.S. NAICS Code ${data.code}: ${data.description}. View 2022 North American Industry Classification System information and industry details.`;


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


<!-- Google Analytics -->

<script async
src="https://www.googletagmanager.com/gtag/js?id=G-BP9YJW8LB9"></script>

<script>

window.dataLayer =
window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}

gtag('js', new Date());

gtag('config', 'G-BP9YJW8LB9');

</script>


<style>

:root {

    --primary:
        #f48120;

    --dark:
        #1e1e24;

    --light:
        #f9f9fb;

    --border:
        #e0e0e6;

}


* {
    box-sizing:
        border-box;
}


body {

    margin:
        0;

    padding:
        20px;

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
        0 4px 18px rgba(0,0,0,.06);

    border-top:
        5px solid var(--primary);

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
        1px solid var(--border);

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
        padding:
            12px;
    }

    h1 {
        font-size:
            24px;
    }

    .card {
        padding:
            18px;
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
Classification
</span>

2022 U.S. North American Industry Classification System (NAICS)

</div>


<div class="source">

<strong>
Official Source:
</strong>

<br>

U.S. Census Bureau —
North American Industry Classification System.

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
href="/usa-naics-search">

← U.S. NAICS Code Search

</a>


</div>


<footer>

U.S. NAICS Code Search<br>

2022 North American Industry Classification System
information based on the U.S. Census Bureau.

</footer>


</div>

</body>

</html>`;

}


/* =========================================
   NOT FOUND
========================================= */

function notFound(
    message
) {

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
        0 4px 18px rgba(0,0,0,.08);

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

<a href="/usa-naics-search">

← U.S. NAICS Code Search

</a>

</div>

</body>

</html>`,

        {

            status:
                404,

            headers: {

                "Content-Type":
                    "text/html; charset=UTF-8"

            }

        }

    );

}


/* =========================================
   CLEAN DESCRIPTION
========================================= */

function cleanDescription(
    value
) {

    return String(value || "")

        .replace(
            /\s+/g,
            " "
        )

        .replace(
            /^\|\s*/,
            ""
        )

        .replace(
            /\s+\|.*$/,
            ""
        )

        .trim();

}


/* =========================================
   STRIP HTML
========================================= */

function stripHtml(
    value
) {

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

function decodeHtml(
    value
) {

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

function cleanText(
    value
) {

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
   HTML ESCAPE
========================================= */

function escapeHtml(
    value
) {

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
