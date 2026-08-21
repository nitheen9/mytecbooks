export async function onRequest(context) {

    const { code } = context.params;

    /* =========================================
       VALIDATE SIC CODE
    ========================================= */

    if (!code) {
        return notFound("SIC code was not provided.");
    }

    const sicCode = String(code).trim();

    if (!/^\d{2,4}$/.test(sicCode)) {
        return notFound("Invalid U.S. SIC code.");
    }


    /* =========================================
       LOAD SIC DATABASE
    ========================================= */

    let sicData;

    try {

        /*
            IMPORTANT:

            This file must exist:

            functions/data/sic-codes.js

            It should export:

            export const sicCodes = [
                {
                    code: "0111",
                    title: "Wheat",
                    description: "...",
                    division: "...",
                    majorGroup: "...",
                    industryGroup: "..."
                }
            ];
        */

        const module =
            await import("../data/sic-codes.js");

        sicData =
            module.sicCodes;

    }
    catch (error) {

        console.error(
            "Unable to load SIC database:",
            error
        );

        return new Response(
            "Unable to load U.S. SIC database.",
            {
                status: 500,
                headers: {
                    "Content-Type":
                        "text/plain; charset=UTF-8"
                }
            }
        );
    }


    if (!Array.isArray(sicData)) {

        return new Response(
            "Invalid SIC database.",
            {
                status: 500,
                headers: {
                    "Content-Type":
                        "text/plain; charset=UTF-8"
                }
            }
        );
    }


    /* =========================================
       FIND SIC
    ========================================= */

    const office =
        sicData.find(function(item) {

            return String(item.code)
                .padStart(4, "0") ===
                sicCode.padStart(4, "0");

        });


    if (!office) {

        return notFound(
            "U.S. SIC code " +
            sicCode +
            " was not found."
        );

    }


    /* =========================================
       RELATED SIC CODES
    ========================================= */

    const related =
        findRelated(
            office,
            sicData
        );


    /* =========================================
       CREATE PAGE
    ========================================= */

    const html =
        createPage(
            office,
            related
        );


    return new Response(
        html,
        {
            status: 200,

            headers: {
                "Content-Type":
                    "text/html; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600, s-maxage=86400"
            }
        }
    );
}


/* =========================================
   RELATED SIC CODES
========================================= */

function findRelated(
    current,
    sicData
) {

    const currentCode =
        String(current.code)
            .padStart(4, "0");

    const majorGroup =
        String(
            current.majorGroup || ""
        )
        .trim()
        .toLowerCase();

    const industryGroup =
        String(
            current.industryGroup || ""
        )
        .trim()
        .toLowerCase();


    let related =
        sicData.filter(function(item) {

            const itemCode =
                String(item.code)
                    .padStart(4, "0");

            if (
                itemCode ===
                currentCode
            ) {
                return false;
            }


            const itemMajor =
                String(
                    item.majorGroup || ""
                )
                .trim()
                .toLowerCase();


            const itemIndustry =
                String(
                    item.industryGroup || ""
                )
                .trim()
                .toLowerCase();


            /*
                Prefer same industry group.
            */

            if (
                industryGroup &&
                itemIndustry ===
                industryGroup
            ) {
                return true;
            }


            /*
                Otherwise same major group.
            */

            if (
                majorGroup &&
                itemMajor ===
                majorGroup
            ) {
                return true;
            }


            return false;

        });


    /*
        Limit related results
        so the page does not become huge.
    */

    return related.slice(0, 20);
}


/* =========================================
   CREATE PAGE
========================================= */

function createPage(
    office,
    related
) {

    const code =
        escapeHtml(
            String(office.code)
                .padStart(4, "0")
        );

    const title =
        escapeHtml(
            office.title ||
            office.description ||
            "U.S. SIC Industry"
        );

    const description =
        escapeHtml(
            office.description ||
            office.title ||
            "U.S. Standard Industrial Classification industry."
        );

    const division =
        escapeHtml(
            office.division ||
            "N/A"
        );

    const majorGroup =
        escapeHtml(
            office.majorGroup ||
            "N/A"
        );

    const industryGroup =
        escapeHtml(
            office.industryGroup ||
            "N/A"
        );


    const relatedHtml =
        related.length > 0

        ?

        related.map(function(item) {

            const itemCode =
                String(item.code)
                    .padStart(4, "0");

            const itemTitle =
                item.title ||
                item.description ||
                "U.S. SIC Industry";


            return `
                <div class="related-row">

                    <a
                        href="/usa-sic/${encodeURIComponent(itemCode)}/">

                        <strong>
                            ${escapeHtml(itemCode)}
                        </strong>

                        -
                        ${escapeHtml(itemTitle)}

                    </a>

                </div>
            `;

        }).join("")

        :

        `
            <p>
                No related SIC codes found.
            </p>
        `;


    return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">


<meta name="robots"
      content="index, follow">


<meta name="description"
      content="${description} - U.S. SIC Code ${code}.">


<link rel="icon"
      type="image/png"
      href="/favicon.png">


<title>
U.S. SIC ${code} - ${title}
</title>


<!-- Google Analytics -->

<script async
src="https://www.googletagmanager.com/gtag/js?id=G-BP9YJW8LB9">
</script>

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

    --primary: #f48120;
    --dark: #1e1e24;
    --light: #f9f9fb;
    --border: #e0e0e6;
    --white: #ffffff;

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

    background: var(--light);

    color: var(--dark);

}


.container {

    max-width: 850px;

    margin: 0 auto;

}


h1 {

    text-align: center;

    margin: 10px 0 10px;

    font-size: 30px;

}


.intro {

    text-align: center;

    color: #666;

    line-height: 1.6;

    margin-bottom: 25px;

}


.card {

    background: white;

    padding: 28px;

    border-radius: 12px;

    box-shadow:
        0 4px 15px
        rgba(0,0,0,.05);

    margin-bottom: 25px;

    border-top:
        5px solid var(--primary);

}


.card h2 {

    margin-top: 0;

    color: #333;

}


.data-row {

    padding: 14px 0;

    border-bottom:
        1px solid var(--border);

    line-height: 1.6;

}


.data-row:last-child {

    border-bottom: none;

}


.label {

    font-weight: 700;

    display: block;

    margin-bottom: 3px;

}


.code {

    display: inline-block;

    padding: 7px 12px;

    background: var(--dark);

    color: white;

    border-radius: 6px;

    font-weight: bold;

    font-size: 18px;

}


.back {

    display: inline-block;

    margin-top: 20px;

    padding: 12px 18px;

    background: var(--primary);

    color: white;

    text-decoration: none;

    border-radius: 7px;

    font-weight: bold;

}


.back:hover {

    opacity: .9;

}


.related-row {

    padding: 12px 0;

    border-bottom:
        1px solid var(--border);

}


.related-row:last-child {

    border-bottom: none;

}


.related-row a {

    color: #1769aa;

    text-decoration: none;

    line-height: 1.5;

}


.related-row a:hover {

    text-decoration: underline;

}


footer {

    text-align: center;

    color: #777;

    font-size: 13px;

    margin: 30px 0 10px;

    line-height: 1.6;

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
🇺🇸 U.S. SIC ${code}
</h1>


<p class="intro">

Standard Industrial Classification
information for SIC ${code}.

</p>


<div class="card">


<h2>
${title}
</h2>


<div class="data-row">

<span class="label">
SIC Code
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
Division
</span>

${division}

</div>


<div class="data-row">

<span class="label">
Major Group
</span>

${majorGroup}

</div>


<div class="data-row">

<span class="label">
Industry Group
</span>

${industryGroup}

</div>


<a
    class="back"
    href="/usa-sic-search.html">

    ← U.S. SIC Code Search

</a>


</div>


<div class="card">


<h2>
🔎 Related U.S. SIC Codes
</h2>


${relatedHtml}


</div>


<footer>

U.S. Standard Industrial Classification
(SIC) information.

<br>

SIC classification information is based
on the U.S. SIC system.

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
U.S. SIC Code Not Found
</title>

<style>

body {

    margin: 0;

    padding: 40px 20px;

    font-family:
        Arial,
        sans-serif;

    background: #f9f9fb;

    text-align: center;

}


.box {

    max-width: 600px;

    margin: auto;

    background: white;

    padding: 30px;

    border-radius: 12px;

    box-shadow:
        0 4px 18px
        rgba(0,0,0,.08);

}


h1 {

    color: #1e1e24;

}


a {

    display: inline-block;

    margin-top: 20px;

    padding: 12px 18px;

    background: #f48120;

    color: white;

    text-decoration: none;

    border-radius: 7px;

}

</style>

</head>


<body>


<div class="box">


<h1>
🇺🇸 U.S. SIC Code Not Found
</h1>


<p>
${escapeHtml(message)}
</p>


<a href="/usa-sic-search.html">
← U.S. SIC Code Search
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
   HTML ESCAPE
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
