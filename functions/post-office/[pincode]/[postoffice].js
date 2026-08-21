export async function onRequest(context) {

    const { pincode, postoffice } = context.params;

    if (!pincode || !postoffice) {
        return new Response("Post Office Not Found", {
            status: 404,
            headers: {
                "Content-Type": "text/plain; charset=UTF-8"
            }
        });
    }

    // Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
        return new Response("Invalid Pincode", {
            status: 400,
            headers: {
                "Content-Type": "text/plain; charset=UTF-8"
            }
        });
    }

    // Decode URL name
    const requestedOffice = decodeURIComponent(postoffice)
        .replace(/-/g, " ")
        .trim()
        .toLowerCase();

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

            return notFound(
                "No post office data found for this pincode."
            );
        }

        const offices = data[0].PostOffice;

        // Find requested Post Office
        const office = offices.find(item => {

            const name = String(item.Name || "")
                .trim()
                .toLowerCase();

            return (
                name === requestedOffice ||
                name.replace(/\s+/g, "-") === postoffice.toLowerCase()
            );

        });

        if (!office) {

            return notFound(
                "Post office not found for pincode " + pincode + "."
            );
        }

        const html = createPage(
            office,
            pincode
        );

        return new Response(html, {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=UTF-8",
                "Cache-Control":
                    "public, max-age=3600, s-maxage=86400"
            }
        });

    }
    catch (error) {

        console.error(
            "Post office error:",
            error
        );

        return new Response(
            "Unable to load post office details.",
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

function createPage(office, pincode) {

    const name =
        escapeHtml(office.Name || "N/A");

    const branchType =
        escapeHtml(
            getOfficeType(
                office.BranchType
            )
        );

    const delivery =
        escapeHtml(
            office.DeliveryStatus || "N/A"
        );

    const district =
        escapeHtml(
            office.District || "N/A"
        );

    const state =
        escapeHtml(
            office.State || "N/A"
        );

    const circle =
        escapeHtml(
            office.Circle || "N/A"
        );

    const region =
        escapeHtml(
            office.Region || "N/A"
        );

    const division =
        escapeHtml(
            office.Division || "N/A"
        );

    const block =
        escapeHtml(
            office.Block || "N/A"
        );

    const pin =
        escapeHtml(pincode);

    const title =
        `${office.Name || "Post Office"} - ${pincode} | India Post Office Finder`;

    const description =
        `Find ${office.Name || "Post Office"} post office details for pincode ${pincode}, including district, state, postal circle, region, division and delivery status.`;

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

<title>${escapeHtml(title)}</title>

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

    --primary: #1976d2;
    --primary-dark: #0d47a1;
    --light: #f3f8ff;
    --border: #d8e3f0;
    --dark: #172033;
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

    color: var(--dark);

    font-size: 30px;

    margin: 10px 0 10px;

}

.intro {

    text-align: center;

    color: #667085;

    line-height: 1.6;

    margin-bottom: 25px;

}

.card {

    background: white;

    padding: 28px;

    border-radius: 14px;

    border-top: 5px solid var(--primary);

    box-shadow:
        0 5px 22px
        rgba(25,118,210,.10);

}

.card h2 {

    margin-top: 0;

    color: var(--primary-dark);

}

.row {

    padding: 14px 0;

    border-bottom:
        1px solid var(--border);

    line-height: 1.6;

}

.row:last-child {

    border-bottom: none;

}

.label {

    font-weight: 700;

    color: #24324a;

}

.pincode {

    display: inline-block;

    padding: 5px 11px;

    background: var(--primary);

    color: white;

    border-radius: 6px;

    font-weight: 700;

}

.badge {

    display: inline-block;

    padding: 5px 10px;

    background: var(--primary-dark);

    color: white;

    border-radius: 5px;

    font-size: 13px;

    font-weight: 700;

}

.back {

    display: inline-block;

    margin-top: 22px;

    padding: 12px 18px;

    background: var(--dark);

    color: white;

    text-decoration: none;

    border-radius: 8px;

    font-weight: 700;

}

.back:hover {

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
🇮🇳 ${name}
</h1>

<p class="intro">

Post Office details for
pincode <strong>${pin}</strong>

</p>


<div class="card">

<h2>
📮 ${name} Post Office
</h2>


<div class="row">

<span class="label">
Post Office:
</span>

<br>

${name}

</div>


<div class="row">

<span class="label">
Pincode:
</span>

<br>

<span class="pincode">
${pin}
</span>

</div>


<div class="row">

<span class="label">
Office Type:
</span>

<br>

<span class="badge">
${branchType}
</span>

</div>


<div class="row">

<span class="label">
Delivery Status:
</span>

<br>

${delivery}

</div>


<div class="row">

<span class="label">
District:
</span>

<br>

${district}

</div>


<div class="row">

<span class="label">
State:
</span>

<br>

${state}

</div>


<div class="row">

<span class="label">
Postal Circle:
</span>

<br>

${circle}

</div>


<div class="row">

<span class="label">
Region:
</span>

<br>

${region}

</div>


<div class="row">

<span class="label">
Division:
</span>

<br>

${division}

</div>


<div class="row">

<span class="label">
Block:
</span>

<br>

${block}

</div>


<a
    class="back"
    href="/post-office/${pin}/">

    ← Search Post Offices for ${pin}

</a>


</div>


<footer>

India Post Office Finder<br>

Postal information is retrieved
from the public India Post Pincode API.

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

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>Post Office Not Found</title>

<style>

body {
    font-family: Arial, sans-serif;
    background: #f5f9ff;
    padding: 40px 20px;
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
    color: #0d47a1;
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

<p>${escapeHtml(message)}</p>

<a href="/post-office/">
← Post Office Finder
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
