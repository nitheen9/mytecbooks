export async function onRequest(context) {

    const zipcode =
        String(
            context.params.zipcode || ""
        ).trim();

    if (!/^\d{5}$/.test(zipcode)) {

        return notFound(
            "Please enter a valid 5-digit U.S. ZIP Code."
        );
    }

    const apiUrl =
        "https://tigerweb.geo.census.gov/arcgis/rest/services/" +
        "TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1/query" +
        "?where=" +
        encodeURIComponent(
            "ZCTA5='" + zipcode + "'"
        ) +
        "&outFields=" +
        encodeURIComponent(
            "ZCTA5,GEOID,BASENAME,NAME,INTPTLAT,INTPTLON"
        ) +
        "&returnGeometry=false" +
        "&f=json";

    try {

        const response =
            await fetch(
                apiUrl,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );

        if (!response.ok) {

            console.error(
                "TIGERweb HTTP:",
                response.status
            );

            return notFound(
                "U.S. ZIP Code area " +
                zipcode +
                " was not found."
            );
        }

        const data =
            await response.json();

        const features =
            Array.isArray(
                data.features
            )
                ? data.features
                : [];

        if (
            features.length === 0
        ) {

            return notFound(
                "U.S. ZIP Code area " +
                zipcode +
                " was not found."
            );
        }

        const attributes =
            features[0].attributes || {};

        return new Response(

            createPage(
                zipcode,
                attributes
            ),

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
            "TIGERweb ZIP error:",
            error
        );

        return new Response(
            "Unable to load U.S. ZIP Code information.",
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
   CREATE PAGE
========================================= */

function createPage(
    zipcode,
    data
) {

    const code =
        String(
            data.ZCTA5 ||
            zipcode
        );

    const geoid =
        String(
            data.GEOID ||
            code
        );

    const basename =
        String(
            data.BASENAME ||
            code
        );

    const name =
        String(
            data.NAME ||
            ""
        );

    const latitude =
        String(
            data.INTPTLAT ||
            ""
        );

    const longitude =
        String(
            data.INTPTLON ||
            ""
        );

    const title =
        "U.S. ZIP Code " +
        code +
        " ZCTA | Census Geographic Information";

    const description =
        "U.S. Census Bureau ZIP Code Tabulation Area " +
        code +
        " with geographic identifier and interior point coordinates.";

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

    margin-top:0;
    color:#333;

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
    margin-bottom:4px;

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

.note {

    margin-top:20px;

    padding:15px;

    background:#fff8ef;

    border-left:
        4px solid
        var(--primary);

    border-radius:7px;

    line-height:1.6;

    color:#555;

    font-size:14px;

}

.source {

    margin-top:20px;

    color:#777;

    font-size:13px;

    line-height:1.6;

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
🇺🇸 U.S. ZIP Code Area ${escapeHtml(code)}
</h1>

<p class="subtitle">

2020 Census ZIP Code Tabulation Area:
<strong>${escapeHtml(name || code)}</strong>

</p>

<div class="card">

<h2>
📍 ZIP Code Area ${escapeHtml(code)}
</h2>

<div class="data-row">

<span class="label">
ZCTA5
</span>

<span class="code">
${escapeHtml(code)}
</span>

</div>

<div class="data-row">

<span class="label">
GEOID
</span>

${escapeHtml(geoid)}

</div>

<div class="data-row">

<span class="label">
Base Name
</span>

${escapeHtml(basename)}

</div>

<div class="data-row">

<span class="label">
Name
</span>

${escapeHtml(name || "Not available")}

</div>

<div class="data-row">

<span class="label">
Interior Point Latitude
</span>

${escapeHtml(latitude || "Not available")}

</div>

<div class="data-row">

<span class="label">
Interior Point Longitude
</span>

${escapeHtml(longitude || "Not available")}

</div>

<div class="note">

<strong>About this data:</strong>

This page uses the U.S. Census Bureau's
2020 Census ZIP Code Tabulation Area (ZCTA)
geographic data. A ZCTA is a Census geographic
representation and is not the same thing as an
official USPS mailing ZIP Code.

</div>

<div class="source">

<strong>Source:</strong>
U.S. Census Bureau TIGERweb

</div>

<a
class="back"
href="/usa-zip-search.html">

← U.S. ZIP Code Search

</a>

</div>

<footer>

U.S. ZIP Code Finder<br>

U.S. Census Bureau TIGERweb — 2020 ZCTA

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
U.S. ZIP Code Area Not Found
</title>

</head>

<body style="
font-family:Arial,sans-serif;
background:#f9f9fb;
padding:40px 20px;
text-align:center;
">

<h1>
🇺🇸 U.S. ZIP Code Area Not Found
</h1>

<p>
${escapeHtml(message)}
</p>

<a href="/usa-zip-search.html">
← U.S. ZIP Code Search
</a>

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
   HTML ESCAPE
========================================= */

function escapeHtml(value) {

    return String(
        value ?? ""
    )

        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}
