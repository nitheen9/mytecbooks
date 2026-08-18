export async function onRequestGet(context) {

    const station = String(context.params.station || "")
        .trim()
        .toUpperCase();

    if (!/^[A-Z0-9]{1,10}$/.test(station)) {
        return new Response(
            createPage(
                "Invalid Railway Station Code",
                `<h1>Invalid Railway Station Code</h1>
                 <p>Please enter a valid Indian Railway station code.</p>`
            ),
            {
                status: 400,
                headers: {
                    "content-type": "text/html;charset=UTF-8"
                }
            }
        );
    }

    try {

        const API_KEY = "YOUR_API_KEY";

        const apiUrl =
            "https://indianrailapi.com/api/v2/StationCodeOrName/apikey/" +
            encodeURIComponent(API_KEY) +
            "/SearchText/" +
            encodeURIComponent(station) +
            "/";

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error("Railway API error");
        }

        const data = await response.json();

        if (
            !data ||
            data.ResponseCode !== "200" ||
            data.Status !== "SUCCESS" ||
            !Array.isArray(data.Station) ||
            data.Station.length === 0
        ) {
            return new Response(
                createPage(
                    "Railway Station Not Found",
                    `<h1>Railway Station Not Found</h1>
                     <p>No railway station information was found for
                     <strong>${escapeHtml(station)}</strong>.</p>`
                ),
                {
                    status: 404,
                    headers: {
                        "content-type": "text/html;charset=UTF-8"
                    }
                }
            );
        }

        const results = data.Station;

        let stationsHtml = "";

        results.forEach(function (item) {

            stationsHtml += `
                <div class="station">

                    <h2>
                        🚉 ${escapeHtml(item.NameEn || "Railway Station")}
                    </h2>

                    <p>
                        <strong>Station Code:</strong>
                        ${escapeHtml(item.StationCode || "N/A")}
                    </p>

                    <p>
                        <strong>Latitude:</strong>
                        ${escapeHtml(item.Latitude || "N/A")}
                    </p>

                    <p>
                        <strong>Longitude:</strong>
                        ${escapeHtml(item.Longitude || "N/A")}
                    </p>

                </div>
            `;
        });

        const first = results[0];

        const content = `

            <h1>
                🚉 ${escapeHtml(first.NameEn || station)}
            </h1>

            <p>
                Indian Railway station information for
                <strong>${escapeHtml(station)}</strong>.
            </p>

            <div class="summary">

                <div>
                    <strong>Station Name</strong><br>
                    ${escapeHtml(first.NameEn || "N/A")}
                </div>

                <div>
                    <strong>Station Code</strong><br>
                    ${escapeHtml(first.StationCode || "N/A")}
                </div>

                <div>
                    <strong>Latitude</strong><br>
                    ${escapeHtml(first.Latitude || "N/A")}
                </div>

                <div>
                    <strong>Longitude</strong><br>
                    ${escapeHtml(first.Longitude || "N/A")}
                </div>

            </div>

            <h2>Railway Station Details</h2>

            ${stationsHtml}

        `;

        return new Response(
            createPage(
                `${first.NameEn || station} Railway Station - ${first.StationCode || station}`,
                content
            ),
            {
                status: 200,
                headers: {
                    "content-type": "text/html;charset=UTF-8",
                    "cache-control": "public, max-age=3600"
                }
            }
        );

    } catch (error) {

        console.error(error);

        return new Response(
            createPage(
                "Railway Station Error",
                `<h1>Railway Station Error</h1>
                 <p>Unable to retrieve railway station information right now.</p>`
            ),
            {
                status: 500,
                headers: {
                    "content-type": "text/html;charset=UTF-8"
                }
            }
        );
    }
}


function createPage(title, content) {

    return `<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

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

        .station {
            background: white;
            padding: 20px;
            margin: 15px 0;
            border-radius: 10px;
            border-left: 4px solid #1976d2;
            box-shadow: 0 2px 10px rgba(0,0,0,.05);
        }

        .station h2 {
            margin-top: 0;
            color: #1976d2;
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
                ← Pincode & IFSC & Railway Station Finder
            </a>
        </p>

        ${content}

    </div>

</div>

</body>

</html>`;
}


function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
