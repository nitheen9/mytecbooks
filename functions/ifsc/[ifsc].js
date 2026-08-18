export async function onRequestGet(context) {

    const ifsc = String(context.params.ifsc || "")
        .trim()
        .toUpperCase();

    // Indian IFSC format: 4 letters + 0 + 6 alphanumeric
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {

        return new Response(
            createPage(
                "Invalid IFSC Code",
                `<h1>Invalid IFSC Code</h1>
                 <p>Please enter a valid 11-character IFSC code.</p>`
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

        const apiUrl =
            "https://ifsc.razorpay.com/" +
            encodeURIComponent(ifsc);

        const response = await fetch(apiUrl);

        if (!response.ok) {

            return new Response(
                createPage(
                    "IFSC Code Not Found",
                    `<h1>IFSC Code Not Found</h1>
                     <p>No bank branch information was found for
                     <strong>${escapeHtml(ifsc)}</strong>.</p>`
                ),
                {
                    status: 404,
                    headers: {
                        "content-type": "text/html;charset=UTF-8"
                    }
                }
            );
        }

        const bank = await response.json();

        if (!bank || !bank.IFSC) {

            return new Response(
                createPage(
                    "IFSC Code Not Found",
                    `<h1>IFSC Code Not Found</h1>
                     <p>No information was found for
                     <strong>${escapeHtml(ifsc)}</strong>.</p>`
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

            <h1>🏦 ${escapeHtml(ifsc)} IFSC Code</h1>

            <p>
                Bank and branch details for
                <strong>${escapeHtml(ifsc)}</strong>.
            </p>

            <div class="summary">

                <div>
                    <strong>IFSC Code</strong><br>
                    ${escapeHtml(bank.IFSC)}
                </div>

                <div>
                    <strong>Bank</strong><br>
                    ${escapeHtml(bank.BANK || "N/A")}
                </div>

                <div>
                    <strong>Branch</strong><br>
                    ${escapeHtml(bank.BRANCH || "N/A")}
                </div>

                <div>
                    <strong>City</strong><br>
                    ${escapeHtml(bank.CITY || "N/A")}
                </div>

                <div>
                    <strong>District</strong><br>
                    ${escapeHtml(bank.DISTRICT || "N/A")}
                </div>

                <div>
                    <strong>State</strong><br>
                    ${escapeHtml(bank.STATE || "N/A")}
                </div>

            </div>

            <div class="details">

                <h2>Bank Branch Details</h2>

                <p>
                    <strong>Bank:</strong>
                    ${escapeHtml(bank.BANK || "N/A")}
                </p>

                <p>
                    <strong>Branch:</strong>
                    ${escapeHtml(bank.BRANCH || "N/A")}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${escapeHtml(bank.ADDRESS || "N/A")}
                </p>

                <p>
                    <strong>Contact:</strong>
                    ${escapeHtml(bank.CONTACT || "N/A")}
                </p>

                <p>
                    <strong>MICR:</strong>
                    ${escapeHtml(bank.MICR || "N/A")}
                </p>

                <p>
                    <strong>Bank Code:</strong>
                    ${escapeHtml(bank.BANKCODE || "N/A")}
                </p>

                <p>
                    <strong>NEFT:</strong>
                    ${bank.NEFT ? "Available" : "Not Available"}
                </p>

                <p>
                    <strong>RTGS:</strong>
                    ${bank.RTGS ? "Available" : "Not Available"}
                </p>

                <p>
                    <strong>IMPS:</strong>
                    ${bank.IMPS ? "Available" : "Not Available"}
                </p>

                <p>
                    <strong>UPI:</strong>
                    ${bank.UPI ? "Available" : "Not Available"}
                </p>

            </div>

        `;

        return new Response(
            createPage(
                `${ifsc} IFSC Code - Bank Branch Details`,
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
                "IFSC Error",
                `<h1>IFSC Error</h1>
                 <p>Unable to retrieve bank information right now.</p>`
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
    <link rel="icon" type="image/png" href="/favicon.png">
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

        .details {
            background: #fff;
            padding: 20px;
            margin-top: 20px;
            border-radius: 10px;
            border-left: 4px solid #1976d2;
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
                ← Pincode & IFSC Finder
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
