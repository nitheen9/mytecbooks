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

        return new Response(
            "Invalid U.S. bank branch.",
            {
                status: 400,

                headers: {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                }
            }
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

        const apiUrl =
            new URL(
                FDIC_API +
                "/locations"
            );

        apiUrl.searchParams.set(
            "format",
            "json"
        );

        apiUrl.searchParams.set(
            "filters",
            "UNINUM:" +
            uninum
        );

        apiUrl.searchParams.set(
            "fields",
            fields
        );

        apiUrl.searchParams.set(
            "limit",
            "10"
        );

        apiUrl.searchParams.set(
            "offset",
            "0"
        );

        const response =
            await fetch(
                apiUrl.toString(),
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (
            !response.ok
        ) {

            throw new Error(
                "FDIC API HTTP " +
                response.status
            );

        }

        const data =
            await response.json();

        const rows =
            Array.isArray(data.data)
                ? data.data
                : [];

        if (
            rows.length === 0
        ) {

            return notFound();

        }

        const raw =
            rows[0] &&
            rows[0].data
                ? rows[0].data
                : rows[0];

        const branch =
            formatBranch(
                raw
            );

        const title =
            branch.name +
            " - " +
            branch.city +
            ", " +
            branch.state;

        const description =
            branch.bankName +
            " branch at " +
            branch.address +
            ", " +
            branch.city +
            ", " +
            branch.stateName +
            " " +
            branch.zip +
            ". FDIC Certificate " +
            branch.cert +
            ".";

        return new Response(
            renderPage(
                branch,
                title,
                description
            ),
            {
                status: 200,

                headers: {

                    "Content-Type":
                        "text/html; charset=UTF-8",

                    "Cache-Control":
                        "public, max-age=3600"

                }

            }
        );

    }
    catch (error) {

        console.error(
            "BRANCH PAGE ERROR:",
            error
        );

        return new Response(
            renderError(),
            {
                status: 500,

                headers: {
                    "Content-Type":
                        "text/html; charset=UTF-8"
                }
            }
        );

    }

}


/* =========================================
   FORMAT BRANCH
========================================= */

function formatBranch(item) {

    return {

        id:
            String(
                item.UNINUM ||
                ""
            ).trim(),

        name:
            String(
                item.OFFNAME ||
                item.NAME ||
                "Bank Branch"
            ).trim(),

        bankName:
            String(
                item.NAME ||
                ""
            ).trim(),

        officeNumber:
            String(
                item.OFFNUM ||
                ""
            ).trim(),

        officeName:
            String(
                item.OFFNAME ||
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

}


/* =========================================
   HTML PAGE
========================================= */

function renderPage(
    branch,
    title,
    description
) {

    const canonical =
        "/us-bank/" +
        encodeURIComponent(
            branch.id
        ) +
        "/";

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

<link rel="canonical"
      href="${canonical}">

<title>
${escapeHtml(title)} | U.S. Bank Finder
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

gtag(
    'js',
    new Date()
);

gtag(
    'config',
    'G-BP9YJW8LB9'
);

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

    margin: 0;

    padding: 20px;

}

.container {

    max-width: 850px;

    margin: 0 auto;

}

h1 {

    text-align: center;

    font-size: 30px;

    margin: 10px 0 12px;

}

.intro {

    text-align: center;

    color: #666;

    line-height: 1.6;

    margin-bottom: 28px;

}

.card {

    background:
        var(--white);

    padding: 25px;

    border-radius: 12px;

    box-shadow:
        0 4px 15px
        rgba(0,0,0,0.05);

    margin-bottom: 20px;

}

.card h2 {

    margin-top: 0;

}

.data-row {

    padding: 14px 0;

    border-bottom:
        1px solid
        var(--border);

    line-height: 1.6;

    word-break: break-word;

}

.data-row:last-child {

    border-bottom: none;

}

.badge {

    display: inline-block;

    background: var(--dark);

    color: white;

    padding: 4px 8px;

    border-radius: 4px;

    font-size: 12px;

    font-weight: bold;

}

.back-link {

    display: inline-block;

    margin-top: 20px;

    padding: 11px 16px;

    background: var(--dark);

    color: white;

    text-decoration: none;

    border-radius: 7px;

    font-weight: bold;

}

.back-link:hover {

    background: #333;

}

footer {

    text-align: center;

    color: #777;

    font-size: 13px;

    margin: 30px 0 10px;

    line-height: 1.6;

}

@media (max-width:600px) {

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
🇺🇸 ${escapeHtml(branch.name)}
</h1>

<p class="intro">

${escapeHtml(branch.bankName)}
branch information and location details.

</p>

<div class="card">

<h2>
🏦 Branch Details
</h2>

<div class="data-row">

<strong>
Bank Name:
</strong>

<br>

${escapeHtml(
    branch.bankName ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
Branch Name:
</strong>

<br>

${escapeHtml(
    branch.name ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
FDIC Certificate:
</strong>

<br>

<span class="badge">

${escapeHtml(
    branch.cert ||
    "N/A"
)}

</span>

</div>

<div class="data-row">

<strong>
FDIC Branch Number:
</strong>

<br>

${escapeHtml(
    branch.id ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
Office Number:
</strong>

<br>

${escapeHtml(
    branch.officeNumber ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
Office Name:
</strong>

<br>

${escapeHtml(
    branch.officeName ||
    "N/A"
)}

</div>

</div>


<div class="card">

<h2>
📍 Location
</h2>

<div class="data-row">

<strong>
Address:
</strong>

<br>

${escapeHtml(
    branch.address ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
City:
</strong>

<br>

${escapeHtml(
    branch.city ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
State:
</strong>

<br>

${escapeHtml(
    branch.stateName ||
    branch.state ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
ZIP Code:
</strong>

<br>

${escapeHtml(
    branch.zip ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
County:
</strong>

<br>

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

<div class="data-row">

<strong>
Service Type:
</strong>

<br>

${escapeHtml(
    branch.serviceTypeDescription ||
    branch.serviceType ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
Main Office:
</strong>

<br>

${escapeHtml(
    branch.mainOffice ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
Last Updated:
</strong>

<br>

${escapeHtml(
    branch.lastUpdated ||
    "N/A"
)}

</div>

<div class="data-row">

<strong>
Coordinates:
</strong>

<br>

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


<div class="card">

<a
    class="back-link"
    href="/us-bank-finder.html">

← Back to U.S. Bank Finder

</a>

</div>


<footer>

U.S. Bank Finder<br>

Bank information is retrieved from
FDIC public data. Verify important
banking information with the institution.

</footer>

</div>

</body>

</html>`;

}


/* =========================================
   404
========================================= */

function notFound() {

    return new Response(
        `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="robots"
      content="noindex">

<title>Bank Branch Not Found</title>

<style>

body {

    font-family: Arial, sans-serif;

    background: #f9f9fb;

    padding: 30px;

    text-align: center;

}

.card {

    max-width: 700px;

    margin: 50px auto;

    background: white;

    padding: 30px;

    border-radius: 12px;

}

a {

    display: inline-block;

    margin-top: 20px;

    padding: 12px 18px;

    background: #1e1e24;

    color: white;

    text-decoration: none;

    border-radius: 7px;

}

</style>

</head>

<body>

<div class="card">

<h1>
🏦 Bank Branch Not Found
</h1>

<p>
The requested U.S. bank branch could not be found.
</p>

<a href="/us-bank-finder.html">
← Back to U.S. Bank Finder
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
   ERROR PAGE
========================================= */

function renderError() {

    return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="robots"
      content="noindex">

<title>Unable to Load Bank Branch</title>

</head>

<body>

<h1>
Unable to Load Bank Branch
</h1>

<p>
Please try again later.
</p>

</body>

</html>`;

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


/* =========================================
   MAIN OFFICE
========================================= */

function formatMainOffice(value) {

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
