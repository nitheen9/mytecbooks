const FDIC_API =
    "https://api.fdic.gov/banks";

export async function onRequest(context) {

    const uninum =
        String(
            context.params.uninum || ""
        ).trim();


    if (
        !/^\d+$/.test(uninum)
    ) {

        return notFound(
            "Invalid FDIC UNINUM."
        );

    }


    try {

        const fields = [

            "UNINUM",
            "NAME",
            "OFFNUM",
            "OFFNAME",
            "ADDRESS",
            "CITY",
            "STALP",
            "STNAME",
            "ZIP",
            "COUNTY",
            "STCNTY",
            "CERT",
            "SERVTYPE",
            "SERVTYPE_DESC",
            "MAINOFF",
            "RUNDATE",
            "LATITUDE",
            "LONGITUDE"

        ].join(",");


        const url =
            new URL(
                FDIC_API +
                "/locations"
            );


        url.searchParams.set(
            "format",
            "json"
        );


        url.searchParams.set(
            "filters",
            "UNINUM:" +
            uninum
        );


        url.searchParams.set(
            "fields",
            fields
        );


        url.searchParams.set(
            "limit",
            "10"
        );


        url.searchParams.set(
            "offset",
            "0"
        );


        const response =
            await fetch(
                url.toString(),
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "FDIC HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


        if (
            !result ||
            !Array.isArray(
                result.data
            ) ||
            result.data.length === 0
        ) {

            return notFound(
                "Bank branch " +
                uninum +
                " was not found."
            );

        }


        const item =
            result.data[0].data ||
            result.data[0];


        const branch = {

            uninum:
                String(
                    item.UNINUM ||
                    uninum
                ).trim(),

            bankName:
                String(
                    item.NAME ||
                    "U.S. Bank"
                ).trim(),

            branchName:
                String(
                    item.OFFNAME ||
                    item.NAME ||
                    "Bank Branch"
                ).trim(),

            officeNumber:
                String(
                    item.OFFNUM ||
                    ""
                ).trim(),

            address:
                String(
                    item.ADDRESS ||
                    ""
                ).trim(),

            city:
                String(
                    item.CITY ||
                    ""
                ).trim(),

            state:
                String(
                    item.STALP ||
                    ""
                ).trim(),

            stateName:
                String(
                    item.STNAME ||
                    ""
                ).trim(),

            zip:
                String(
                    item.ZIP ||
                    ""
                ).trim(),

            county:
                String(
                    item.COUNTY ||
                    item.STCNTY ||
                    ""
                ).trim(),

            cert:
                String(
                    item.CERT ||
                    ""
                ).trim(),

            serviceType:
                String(
                    item.SERVTYPE ||
                    ""
                ).trim(),

            serviceTypeDescription:
                String(
                    item.SERVTYPE_DESC ||
                    ""
                ).trim(),

            mainOffice:
                formatMainOffice(
                    item.MAINOFF
                ),

            lastUpdated:
                String(
                    item.RUNDATE ||
                    ""
                ).trim(),

            latitude:
                String(
                    item.LATITUDE ||
                    ""
                ).trim(),

            longitude:
                String(
                    item.LONGITUDE ||
                    ""
                ).trim()

        };


        const html =
            createPage(
                branch
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
    catch (error) {

        console.error(
            "UNINUM PAGE ERROR:",
            error
        );

        return new Response(
            "Unable to load bank branch details.",
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
   PAGE
========================================= */

function createPage(
    branch
) {

    const title =
        branch.branchName +
        " - " +
        branch.city +
        ", " +
        branch.stateName;


    const description =
        "Find U.S. bank branch details for " +
        branch.branchName +
        ", including address, city, state, ZIP code, county, FDIC certificate and UNINUM.";


    return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<meta name="robots"
content="index, follow">

<meta name="description"
content="${escapeHtml(
    description
)}">

<link
rel="canonical"
href="https://mytecbooks.pages.dev/us-bank/${encodeURIComponent(
    branch.uninum
)}/">

<link
rel="icon"
type="image/png"
href="/favicon.png">

<title>
${escapeHtml(
    title
)} | U.S. Bank Finder
</title>


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

gtag(
    'config',
    'G-BP9YJW8LB9'
);

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

    --white:
        #ffffff;

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

    font-size:
        30px;

    margin:
        10px 0 12px;

}

.intro {

    text-align:
        center;

    color:
        #666;

    line-height:
        1.6;

    margin-bottom:
        28px;

}

.card {

    background:
        var(--white);

    padding:
        25px;

    border-radius:
        12px;

    box-shadow:
        0 4px 15px
        rgba(0,0,0,.05);

    margin-bottom:
        25px;

}

.card h2 {

    margin-top:
        0;

}

.row {

    padding:
        14px 0;

    border-bottom:
        1px solid
        var(--border);

    line-height:
        1.7;

    word-break:
        break-word;

}

.row:last-child {

    border-bottom:
        none;

}

.label {

    font-weight:
        bold;

    display:
        block;

    margin-bottom:
        3px;

}

.uninum {

    display:
        inline-block;

    padding:
        6px 10px;

    background:
        var(--primary);

    color:
        white;

    border-radius:
        5px;

    font-weight:
        bold;

}

.badge {

    display:
        inline-block;

    padding:
        5px 9px;

    background:
        var(--dark);

    color:
        white;

    border-radius:
        5px;

    font-size:
        12px;

    font-weight:
        bold;

}

.back {

    display:
        inline-block;

    margin-top:
        20px;

    padding:
        12px 18px;

    background:
        var(--dark);

    color:
        white;

    text-decoration:
        none;

    border-radius:
        8px;

    font-weight:
        bold;

}

.back:hover {

    background:
        #333;

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

🇺🇸 ${escapeHtml(
    branch.branchName
)}

</h1>


<p class="intro">

${escapeHtml(
    branch.bankName
)}

branch information and location details.

</p>


<div class="card">


<h2>
🏦 Bank Branch Details
</h2>


<div class="row">

<span class="label">
Bank Name
</span>

${escapeHtml(
    branch.bankName
)}

</div>


<div class="row">

<span class="label">
Branch Name
</span>

${escapeHtml(
    branch.branchName
)}

</div>


<div class="row">

<span class="label">
FDIC UNINUM
</span>

<span class="uninum">

${escapeHtml(
    branch.uninum
)}

</span>

</div>


<div class="row">

<span class="label">
FDIC Certificate
</span>

<span class="badge">

${escapeHtml(
    branch.cert ||
    "N/A"
)}

</span>

</div>


<div class="row">

<span class="label">
Office Number
</span>

${escapeHtml(
    branch.officeNumber ||
    "N/A"
)}

</div>


</div>


<div class="card">


<h2>
📍 Address & Location
</h2>


<div class="row">

<span class="label">
Address
</span>

${escapeHtml(
    branch.address ||
    "N/A"
)}

</div>


<div class="row">

<span class="label">
City
</span>

${escapeHtml(
    branch.city ||
    "N/A"
)}

</div>


<div class="row">

<span class="label">
State
</span>

${escapeHtml(
    branch.stateName ||
    branch.state ||
    "N/A"
)}

</div>


<div class="row">

<span class="label">
ZIP Code
</span>

${escapeHtml(
    branch.zip ||
    "N/A"
)}

</div>


<div class="row">

<span class="label">
County
</span>

${escapeHtml(
    branch.county ||
    "N/A"
)}

</div>


</div>


<div class="card">


<h2>
🏢 Branch Information
</h2>


<div class="row">

<span class="label">
Service Type
</span>

${escapeHtml(
    branch.serviceTypeDescription ||
    branch.serviceType ||
    "N/A"
)}

</div>


<div class="row">

<span class="label">
Main Office
</span>

${escapeHtml(
    branch.mainOffice ||
    "N/A"
)}

</div>


<div class="row">

<span class="label">
Last Updated
</span>

${escapeHtml(
    branch.lastUpdated ||
    "N/A"
)}

</div>


<div class="row">

<span class="label">
Coordinates
</span>

${escapeHtml(
    branch.latitude ||
    "N/A"
)},

${escapeHtml(
    branch.longitude ||
    "N/A"
)}

</div>


</div>


<a
    class="back"
    href="/us-bank-finder.html">

← Back to U.S. Bank Finder

</a>


<footer>

U.S. Bank Finder<br>

Bank information is retrieved from
FDIC public data.

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
Bank Branch Not Found
</title>

<style>

body {

    font-family:
        Arial,
        sans-serif;

    background:
        #f9f9fb;

    text-align:
        center;

    padding:
        40px 20px;

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

}

</style>

</head>

<body>

<div class="box">

<h1>
🏦 Bank Branch Not Found
</h1>

<p>
${escapeHtml(
    message
)}
</p>

<a href="/us-bank-finder.html">

← U.S. Bank Finder

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
   MAIN OFFICE
========================================= */

function formatMainOffice(
    value
) {

    const normalized =
        String(value || "")
            .trim()
            .toUpperCase();

    if (
        normalized === "1" ||
        normalized === "Y" ||
        normalized === "YES" ||
        normalized === "TRUE"
    ) {

        return "Yes";

    }

    if (
        normalized === "0" ||
        normalized === "N" ||
        normalized === "NO" ||
        normalized === "FALSE"
    ) {

        return "No";

    }

    return String(
        value || ""
    ).trim();

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
