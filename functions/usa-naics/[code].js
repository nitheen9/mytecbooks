export async function onRequest(context) {

    const code =
        String(
            context.params.code || ""
        ).trim();


    /*
     * ONLY 6-DIGIT NAICS CODES
     */

    if (
        !/^\d{6}$/.test(code)
    ) {

        return notFound(
            "Please enter a valid 6-digit 2022 U.S. NAICS code."
        );

    }


    try {

        const jsonUrl =
            new URL(
                "/data/naics2022_all.json",
                context.request.url
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

            return serverError(
                "Unable to load the 2022 U.S. NAICS database."
            );

        }


        const records =
            await response.json();


        if (!Array.isArray(records)) {

            return serverError(
                "Invalid 2022 U.S. NAICS database."
            );

        }


        /*
         * Find exact 6-digit code.
         */

        const record =
            records.find(
                function (item) {

                    return (
                        item &&
                        String(item.code) === code
                    );

                }
            );


        if (!record) {

            return notFound(
                "U.S. NAICS code " +
                code +
                " was not found in the 2022 classification."
            );

        }


        const title =
            String(
                record.title || ""
            ).trim();


        if (!title) {

            return notFound(
                "U.S. NAICS code " +
                code +
                " was not found in the 2022 classification."
            );

        }


        return new Response(

            createPage(
                code,
                title
            ),

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


        return serverError(
            "Unable to load the 2022 U.S. NAICS database."
        );

    }

}


/* =========================================
   CREATE PAGE
========================================= */

function createPage(
    code,
    title
) {

    const safeCode =
        escapeHtml(code);

    const safeTitle =
        escapeHtml(title);


    const pageTitle =
        code +
        " - " +
        title +
        " | 2022 U.S. NAICS Code";


    const description =
        "2022 U.S. NAICS Code " +
        code +
        ": " +
        title +
        ". Official 2022 U.S. NAICS industry classification.";


    const censusUrl =
        "https://www.census.gov/naics/?details=" +
        encodeURIComponent(code) +
        "&input=" +
        encodeURIComponent(code) +
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
content="${escapeHtml(description)}">

<link rel="icon"
type="image/png"
href="/favicon.png">

<title>
${escapeHtml(pageTitle)}
</title>

<style>

:root {

    --primary:#f48120;
    --dark:#1e1e24;
    --light:#f9f9fb;
    --border:#e0e0e6;

}

* {

    box-sizing:border-box;

}

body {

    margin:0;

    padding:20px;

    font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;

    background:var(--light);

    color:var(--dark);

}

.container {

    max-width:850px;

    margin:0 auto;

}

h1 {

    text-align:center;

    margin:10px 0 12px;

    font-size:30px;

}

.subtitle {

    text-align:center;

    color:#666;

    line-height:1.6;

    margin-bottom:25px;

}

.card {

    background:#fff;

    padding:28px;

    border-radius:12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.06);

    border-top:
        5px solid
        var(--primary);

}

.card h2 {

    color:#333;

    margin-top:0;

    line-height:1.4;

}

.data-row {

    padding:15px 0;

    border-bottom:
        1px solid
        var(--border);

    line-height:1.7;

}

.data-row:last-child {

    border-bottom:none;

}

.label {

    display:block;

    font-weight:700;

    margin-bottom:5px;

}

.code {

    display:inline-block;

    background:var(--dark);

    color:#fff;

    padding:7px 12px;

    border-radius:6px;

    font-weight:700;

    letter-spacing:1px;

}

.source {

    margin-top:25px;

    padding:15px;

    background:#fff8ef;

    border-radius:8px;

    line-height:1.6;

    font-size:14px;

}

.source a {

    color:#b85c00;

    font-weight:700;

}

.back {

    display:inline-block;

    margin-top:25px;

    padding:12px 18px;

    background:var(--dark);

    color:#fff;

    text-decoration:none;

    border-radius:7px;

    font-weight:700;

}

footer {

    text-align:center;

    color:#777;

    font-size:13px;

    margin:30px 0 10px;

    line-height:1.6;

}

@media(max-width:600px) {

    body {
        padding:12px;
    }

    h1 {
        font-size:24px;
    }

    .card {
        padding:18px;
    }

}

</style>

</head>

<body>

<div class="container">

<h1>
🇺🇸 U.S. NAICS Code ${safeCode}
</h1>

<p class="subtitle">

2022 North American Industry Classification System:
<strong>${safeTitle}</strong>

</p>

<div class="card">

<h2>
🏭 NAICS ${safeCode} — ${safeTitle}
</h2>

<div class="data-row">

<span class="label">
NAICS Code
</span>

<span class="code">
${safeCode}
</span>

</div>

<div class="data-row">

<span class="label">
Industry Description
</span>

${safeTitle}

</div>

<div class="data-row">

<span class="label">
Classification
</span>

2022 U.S. NAICS — 6-digit national industry

</div>

<div class="data-row">

<span class="label">
Industry Details
</span>

${safeTitle} is an official 6-digit industry in the
2022 U.S. NAICS classification.

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

View NAICS ${safeCode} on U.S. Census Bureau →

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

2022 U.S. NAICS Classification<br>

Source: U.S. Census Bureau

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

    font-family:Arial,sans-serif;

    background:#f9f9fb;

    padding:40px 20px;

    text-align:center;

}

.box {

    max-width:650px;

    margin:auto;

    background:#fff;

    padding:30px;

    border-radius:12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.08);

}

h1 {

    color:#1e1e24;

}

a {

    display:inline-block;

    margin-top:20px;

    padding:12px 18px;

    background:#f48120;

    color:#fff;

    text-decoration:none;

    border-radius:7px;

    font-weight:bold;

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

            status:404,

            headers:{

                "Content-Type":
                    "text/html; charset=UTF-8"

            }

        }

    );

}


/* =========================================
   SERVER ERROR
========================================= */

function serverError(
    message
) {

    return new Response(

        message,

        {

            status:500,

            headers:{

                "Content-Type":
                    "text/plain; charset=UTF-8"

            }

        }

    );

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
