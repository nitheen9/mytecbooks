export async function onRequest(context) {

    const { params } = context;

    const pincode = String(params.pincode || "").trim();
    const officeSlug = String(params.office || "").trim().toLowerCase();

    // Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
        return new Response(
            "Invalid pincode.",
            {
                status: 404,
                headers: {
                    "content-type": "text/html; charset=UTF-8"
                }
            }
        );
    }

    if (!officeSlug) {
        return new Response(
            "Post office not found.",
            {
                status: 404,
                headers: {
                    "content-type": "text/html; charset=UTF-8"
                }
            }
        );
    }

    try {

        const apiUrl =
            "https://api.postalpincode.in/pincode/" +
            encodeURIComponent(pincode);

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error("Postal API error");
        }

        const data = await response.json();

        if (
            !Array.isArray(data) ||
            !data[0] ||
            data[0].Status !== "Success" ||
            !Array.isArray(data[0].PostOffice)
        ) {
            return notFoundPage(
                "Post Office Not Found",
                pincode
            );
        }

        const offices = data[0].PostOffice;

        // Find office by URL slug
        const office = offices.find(function(item) {

            const name =
                String(item.Name || "")
                    .trim();

            return slugify(name) === officeSlug;

        });

        if (!office) {

            return notFoundPage(
                "Post Office Not Found",
                pincode
            );

        }

        const name =
            office.Name || "N/A";

        const branchType =
            office.BranchType || "N/A";

        const deliveryStatus =
            office.DeliveryStatus || "N/A";

        const district =
            office.District || "N/A";

        const state =
            office.State || "N/A";

        const circle =
            office.Circle || "N/A";

        const region =
            office.Region || "N/A";

        const division =
            office.Division || "N/A";

        const block =
            office.Block || "N/A";

        const pincodeValue =
            office.Pincode || pincode;


        const title =
            `${name} Post Office, ${pincodeValue} - Pincode, Address & Details`;

        const description =
            `Complete details of ${name} Post Office, Pincode ${pincodeValue}. Find district, state, postal circle, region, division, branch type and delivery status.`;


        const html = `<!DOCTYPE html>
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
      href="https://mytecbooks.pages.dev/post-office/${encodeURIComponent(pincodeValue)}/${encodeURIComponent(slugify(name))}/">

<title>${escapeHtml(title)}</title>

<script async
        src="https://www.googletagmanager.com/gtag/js?id=G-BP9YJW8LB9"></script>

<script>

window.dataLayer = window.dataLayer || [];

function gtag() {
    dataLayer.push(arguments);
}

gtag('js', new Date());

gtag('config', 'G-BP9YJW8LB9');

</script>

<style>

:root {
    --primary: #1976d2;
    --primary-dark: #0d47a1;
    --light: #f3f8ff;
    --border: #d8e3f0;
    --dark: #172033;
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
        linear-gradient(
            135deg,
            #eef7ff,
            #f8fbff
        );

    color: var(--dark);
}

.container {

    max-width: 850px;

    margin: 0 auto;
}

h1 {

    text-align: center;

    font-size: 30px;

    margin: 10px 0 12px;

    color: var(--dark);
}

.intro {

    text-align: center;

    color: #5f6b7a;

    line-height: 1.6;

    margin-bottom: 25px;
}

.card {

    background: white;

    padding: 28px;

    border-radius: 14px;

    box-shadow:
        0 5px 22px rgba(25,118,210,.10);

    border-top: 5px solid var(--primary);
}

.card h2 {

    margin-top: 0;

    color: var(--primary-dark);
}

.data-row {

    padding: 14px 0;

    border-bottom:
        1px solid var(--border);

    line-height: 1.6;

    word-break: break-word;
}

.data-row:last-child {

    border-bottom: none;
}

.label {

    font-weight: 700;

    color: #24324a;
}

.pincode {

    display: inline-block;

    padding: 5px 11px;

    border-radius: 6px;

    background: var(--primary);

    color: white;

    font-weight: 700;
}

.badge {

    display: inline-block;

    padding: 5px 10px;

    border-radius: 6px;

    background: var(--primary-dark);

    color: white;

    font-size: 13px;

    font-weight: 700;
}

.button {

    display: inline-block;

    margin-top: 22px;

    padding: 13px 20px;

    background: var(--dark);

    color: white;

    text-decoration: none;

    border-radius: 8px;

    font-weight: 700;
}

.button:hover {

    background: #333;
}

footer {

    text-align: center;

    color: #6b7280;

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
📮 ${escapeHtml(name)} Post Office
</h1>

<p class="intro">
Complete postal information for
${escapeHtml(name)} Post Office,
Pincode ${escapeHtml(pincodeValue)}.
</p>

<div class="card">

<h2>
📍 Post Office Details
</h2>

<div class="data-row">

<span class="label">
Post Office:
</span>

<br>

${escapeHtml(name)}

</div>

<div class="data-row">

<span class="label">
Pincode:
</span>

<br>

<span class="pincode">
${escapeHtml(pincodeValue)}
</span>

</div>

<div class="data-row">

<span class="label">
Office Type:
</span>

<br>

<span class="badge">
${escapeHtml(getOfficeType(branchType))}
</span>

</div>

<div class="data-row">

<span class="label">
Delivery Status:
</span>

<br>

${escapeHtml(deliveryStatus)}

</div>

<div class="data-row">

<span class="label">
District:
</span>

<br>

${escapeHtml(district)}

</div>

<div class="data-row">

<span class="label">
State:
</span>

<br>

${escapeHtml(state)}

</div>

<div class="data-row">

<span class="label">
Postal Circle:
</span>

<br>

${escapeHtml(circle)}

</div>

<div class="data-row">

<span class="label">
Region:
</span>

<br>

${escapeHtml(region)}

</div>

<div class="data-row">

<span class="label">
Division:
</span>

<br>

${escapeHtml(division)}

</div>

<div class="data-row">

<span class="label">
Block:
</span>

<br>

${escapeHtml(block)}

</div>

<a
    class="button"
    href="/pincode/${encodeURIComponent(pincodeValue)}/">

    View All Post Offices for Pincode ${escapeHtml(pincodeValue)} →

</a>

</div>

<footer>

India Post Office Finder<br>

Postal information is retrieved from
external public postal data.

</footer>

</div>

</body>

</html>`;


        return new Response(
            html,
            {
                status: 200,
                headers: {
                    "content-type":
                        "text/html; charset=UTF-8",
                    "cache-control":
                        "public, max-age=3600"
                }
            }
        );

    }
    catch (error) {

        console.error(
            "Post Office Function Error:",
            error
        );

        return new Response(

            errorPage(),

            {
                status: 500,
                headers: {
                    "content-type":
                        "text/html; charset=UTF-8"
                }
            }

        );

    }

}


/* =========================================
   SLUGIFY
========================================= */

function slugify(value) {

    return String(value || "")

        .toLowerCase()

        .trim()

        .replace(/&/g, "and")

        .replace(/[^a-z0-9]+/g, "-")

        .replace(/^-+|-+$/g, "");

}


/* =========================================
   OFFICE TYPE
========================================= */

function getOfficeType(type) {

    switch (
        String(type || "")
            .toUpperCase()
    ) {

        case "HO":
            return "Head Post Office";

        case "SO":
            return "Sub Post Office";

        case "BO":
            return "Branch Post Office";

        default:
            return type || "N/A";

    }

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* =========================================
   404 PAGE
========================================= */

function notFoundPage(title, pincode) {

    return new Response(

`<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<meta name="robots"
      content="noindex">

<title>${escapeHtml(title)}</title>

<style>

body {
    font-family: Arial, sans-serif;
    background: #f5f9ff;
    padding: 30px;
    text-align: center;
}

.box {
    max-width: 650px;
    margin: 50px auto;
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,.08);
}

a {
    display: inline-block;
    margin-top: 20px;
    padding: 12px 18px;
    background: #1976d2;
    color: white;
    text-decoration: none;
    border-radius: 7px;
}

</style>

</head>

<body>

<div class="box">

<h1>📮 Post Office Not Found</h1>

<p>
The requested post office could not be found
for pincode ${escapeHtml(pincode)}.
</p>

<a href="/post-office-finder.html">
Back to Post Office Finder
</a>

</div>

</body>

</html>`,

        {
            status: 404,
            headers: {
                "content-type":
                    "text/html; charset=UTF-8"
            }
        }

    );

}


/* =========================================
   ERROR PAGE
========================================= */

function errorPage() {

    return `<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>Post Office Finder Error</title>

</head>

<body>

<h1>Unable to load post office information</h1>

<p>Please try again later.</p>

</body>

</html>`;

}
