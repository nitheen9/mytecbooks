import railwayData from "../data/RailwayStationCode.json";

export async function onRequestGet(context) {

    const code = String(context.params.station || "")
        .trim()
        .toUpperCase();

    const station = railwayData.find(function (item) {
        return String(item.station_code || "").toUpperCase() === code;
    });

    if (!station) {

        return new Response(
            createPage(
                "Railway Station Not Found",
                `Railway station information was not found for station code ${code}.`,
                `
                <h1>Railway Station Not Found</h1>

                <p>
                    No railway station information was found for
                    <strong>${escapeHtml(code)}</strong>.
                </p>
                `
            ),
            {
                status: 404,
                headers: {
                    "content-type": "text/html;charset=UTF-8"
                }
            }
        );
    }


    const stationName = station.station_name || "Railway Station";
    const stationCode = station.station_code || code;

    // Unique description for this railway station page
    const description =
        `${stationName} Railway Station (${stationCode}) - Find station code, division, railway zone, district and state information.`;


    const content = `

        <h1>🚉 ${escapeHtml(stationName)}</h1>

        <p>
            Railway station information for
            <strong>${escapeHtml(stationCode)}</strong>.
        </p>

        <div class="summary">

            <div>
                <strong>Station Name</strong><br>
                ${escapeHtml(stationName)}
            </div>

            <div>
                <strong>Station Code</strong><br>
                ${escapeHtml(stationCode)}
            </div>

            <div>
                <strong>Division</strong><br>
                ${escapeHtml(station.division || "N/A")}
            </div>

            <div>
                <strong>Division Code</strong><br>
                ${escapeHtml(station.division_code || "N/A")}
            </div>

            <div>
                <strong>Zone</strong><br>
                ${escapeHtml(station.zone || "N/A")}
            </div>

            <div>
                <strong>Zone Code</strong><br>
                ${escapeHtml(station.zone_code || "N/A")}
            </div>

            <div>
                <strong>District</strong><br>
                ${escapeHtml(station.district || "N/A")}
            </div>

            <div>
                <strong>State</strong><br>
                ${escapeHtml(station.state || "N/A")}
            </div>

        </div>

        <h2>${escapeHtml(stationName)} Railway Station</h2>

        <p>
            <strong>${escapeHtml(stationName)}</strong>
            is a railway station with station code
            <strong>${escapeHtml(stationCode)}</strong>.
            It is located in
            ${escapeHtml(station.district || "N/A")},
            ${escapeHtml(station.state || "N/A")}.
        </p>

    `;


    return new Response(
        createPage(
            `${stationName} Railway Station - ${stationCode}`,
            description,
            content
        ),
        {
            status: 200,
            headers: {
                "content-type": "text/html;charset=UTF-8",
                "cache-control": "public, max-age=86400"
            }
        }
    );
}


function createPage(title, description, content) {

    return `<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <meta name="google-site-verification"
          content="dDDf6n61Y6wtILH1Z-cim30ml4yMKMiZu5wJht9j-ko">

    <meta name="robots"
          content="index, follow">

    <meta name="description"
          content="${escapeHtml(description)}">

    <link rel="icon"
          type="image/png"
          href="/favicon.png">

    <title>${escapeHtml(title)}</title>

    <style>

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 20px;
            background: #f7f7f9;
            color: #222;
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }

        .container {
            max-width: 850px;
            margin: auto;
        }

        .box {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 3px 12px rgba(0,0,0,.06);
        }

        h1 {
            margin-top: 0;
            font-size: 30px;
        }

        h2 {
            margin-top: 25px;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin: 20px 0;
        }

        .summary div {
            background: #f1f1f5;
            padding: 14px;
            border-radius: 8px;
        }

        @media(max-width:600px) {

            body {
                padding: 12px;
            }

            h1 {
                font-size: 25px;
            }

            .summary {
                grid-template-columns: 1fr;
            }

        }

    </style>

</head>

<body>

<div class="container">

    <div class="box">

        <p>
            <a href="/">
                ← Railway Station Finder
            </a>
        </p>

        ${content}

    </div>

</div>

</body>

</html>`;
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
