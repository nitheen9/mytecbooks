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

    const content = `

        <h1>🚉 ${escapeHtml(station.station_name)}</h1>

        <p>
            Railway station information for
            <strong>${escapeHtml(station.station_code)}</strong>.
        </p>

        <div class="summary">

            <div>
                <strong>Station Name</strong><br>
                ${escapeHtml(station.station_name)}
            </div>

            <div>
                <strong>Station Code</strong><br>
                ${escapeHtml(station.station_code)}
            </div>

            <div>
                <strong>Division</strong><br>
                ${escapeHtml(station.division)}
            </div>

            <div>
                <strong>Division Code</strong><br>
                ${escapeHtml(station.division_code)}
            </div>

            <div>
                <strong>Zone</strong><br>
                ${escapeHtml(station.zone)}
            </div>

            <div>
                <strong>Zone Code</strong><br>
                ${escapeHtml(station.zone_code)}
            </div>

            <div>
                <strong>District</strong><br>
                ${escapeHtml(station.district)}
            </div>

            <div>
                <strong>State</strong><br>
                ${escapeHtml(station.state)}
            </div>

        </div>

        <h2>${escapeHtml(station.station_name)} Railway Station</h2>

        <p>
            <strong>${escapeHtml(station.station_name)}</strong>
            is a railway station with station code
            <strong>${escapeHtml(station.station_code)}</strong>.
            It is located in ${escapeHtml(station.district)},
            ${escapeHtml(station.state)}.
        </p>

    `;

    return new Response(
        createPage(
            `${station.station_name} Railway Station - ${station.station_code}`,
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
