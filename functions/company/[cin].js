export async function onRequestGet(context) {

    const cin = String(context.params.cin || "")
        .trim()
        .toUpperCase();

    if (!cin) {
        return new Response(
            createPage(
                "Invalid CIN",
                `
                <h1>Invalid CIN</h1>
                <p>Please enter a valid Corporate Identification Number.</p>
                `
            ),
            {
                status: 400,
                headers: {
                    "content-type": "text/html;charset=UTF-8"
                }
            }
        );
    }

    /*
     * Cloudflare Pages secret
     *
     * Settings → Environment variables →
     * Add secret:
     *
     * DATA_GOV_API_KEY
     */

    const apiKey = context.env.DATA_GOV_API_KEY;

    if (!apiKey) {
        console.error("DATA_GOV_API_KEY is not configured.");

        return new Response(
            createPage(
                "Company Lookup Error",
                `
                <h1>Company Lookup Error</h1>

                <p>
                    The company database API is not configured.
                    Please try again later.
                </p>
                `
            ),
            {
                status: 500,
                headers: {
                    "content-type": "text/html;charset=UTF-8"
                }
            }
        );
    }

    try {

        const apiUrl =
            "https://api.data.gov.in/resource/4dbe5667-7b6b-41d7-82af-211562424d9a" +
            "?api-key=" +
            encodeURIComponent(apiKey) +
            "&format=json" +
            "&limit=100" +
            "&filters[CompanyStatus]=ACTIVE";

        const response = await fetch(apiUrl);

        if (!response.ok) {

            console.error(
                "Data.gov.in API error:",
                response.status
            );

            return new Response(
                createPage(
                    "Company Lookup Error",
                    `
                    <h1>Company Lookup Error</h1>

                    <p>
                        Unable to retrieve company information
                        right now.
                    </p>
                    `
                ),
                {
                    status: 502,
                    headers: {
                        "content-type": "text/html;charset=UTF-8"
                    }
                }
            );
        }

        const data = await response.json();

        /*
         * Data.gov.in normally returns:
         *
         * {
         *   records: [...]
         * }
         */

        const records =
            data && Array.isArray(data.records)
                ? data.records
                : [];

        /*
         * Find the requested CIN.
         *
         * We check several possible capitalization
         * variations because API field names can differ.
         */

        const company = records.find(function (item) {

            const value =
                item.CORPORATE_IDENTIFICATION_NUMBER ??
                item.corporate_identification_number ??
                item["Corporate Identification Number"] ??
                "";

            return String(value)
                .trim()
                .toUpperCase() === cin;
        });


        /*
         * If the API's status filter did not return
         * the company, return Not Found.
         */

        if (!company) {

            return new Response(
                createPage(
                    "Company Not Found",
                    `
                    <h1>Company Not Found</h1>

                    <p>
                        No active company information was found
                        for
                        <strong>${escapeHtml(cin)}</strong>.
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


        /*
         * Get the exact fields from your dataset.
         */

        const cinValue =
            getField(
                company,
                "CORPORATE_IDENTIFICATION_NUMBER"
            );

        const registrationDate =
            getField(
                company,
                "DATE_OF_REGISTRATION"
            );

        const companyName =
            getField(
                company,
                "COMPANY_NAME"
            );

        const companyStatus =
            getField(
                company,
                "COMPANY_STATUS"
            );

        const companyClass =
            getField(
                company,
                "COMPANY_CLASS"
            );

        const companyCategory =
            getField(
                company,
                "COMPANY_CATEGORY"
            );

        const authorizedCapital =
            getField(
                company,
                "AUTHORIZED_CAPITAL"
            );

        const paidUpCapital =
            getField(
                company,
                "PAIDUP_CAPITAL"
            );

        const registeredState =
            getField(
                company,
                "REGISTERED_STATE"
            );

        const registrar =
            getField(
                company,
                "REGISTRAR_OF_COMPANIES"
            );

        const businessActivity =
            getField(
                company,
                "PRINCIPAL_BUSINESS_ACTIVITY"
            );

        const registeredAddress =
            getField(
                company,
                "REGISTERED_OFFICE_ADDRESS"
            );

        const subCategory =
            getField(
                company,
                "SUB_CATEGORY"
            );


        const content = `

            <h1>
                🏢 ${escapeHtml(companyName || cinValue)}
            </h1>

            <p>
                Company information for
                <strong>${escapeHtml(cinValue || cin)}</strong>.
            </p>


            <div class="summary">

                <div>
                    <strong>CIN</strong><br>
                    ${escapeHtml(cinValue || cin)}
                </div>

                <div>
                    <strong>Company Name</strong><br>
                    ${escapeHtml(companyName)}
                </div>

                <div>
                    <strong>Company Status</strong><br>
                    ${escapeHtml(companyStatus)}
                </div>

                <div>
                    <strong>Date of Registration</strong><br>
                    ${escapeHtml(registrationDate)}
                </div>

                <div>
                    <strong>Company Class</strong><br>
                    ${escapeHtml(companyClass)}
                </div>

                <div>
                    <strong>Company Category</strong><br>
                    ${escapeHtml(companyCategory)}
                </div>

                <div>
                    <strong>Registered State</strong><br>
                    ${escapeHtml(registeredState)}
                </div>

                <div>
                    <strong>Registrar of Companies</strong><br>
                    ${escapeHtml(registrar)}
                </div>

            </div>


            <div class="details">

                <h2>Company Details</h2>

                <p>
                    <strong>Corporate Identification Number:</strong><br>
                    ${escapeHtml(cinValue || cin)}
                </p>

                <p>
                    <strong>Date of Registration:</strong><br>
                    ${escapeHtml(registrationDate)}
                </p>

                <p>
                    <strong>Company Name:</strong><br>
                    ${escapeHtml(companyName)}
                </p>

                <p>
                    <strong>Company Status:</strong><br>
                    ${escapeHtml(companyStatus)}
                </p>

                <p>
                    <strong>Company Class:</strong><br>
                    ${escapeHtml(companyClass)}
                </p>

                <p>
                    <strong>Company Category:</strong><br>
                    ${escapeHtml(companyCategory)}
                </p>

                <p>
                    <strong>Authorized Capital:</strong><br>
                    ${escapeHtml(authorizedCapital)}
                </p>

                <p>
                    <strong>Paid-up Capital:</strong><br>
                    ${escapeHtml(paidUpCapital)}
                </p>

                <p>
                    <strong>Registered State:</strong><br>
                    ${escapeHtml(registeredState)}
                </p>

                <p>
                    <strong>Registrar of Companies:</strong><br>
                    ${escapeHtml(registrar)}
                </p>

                <p>
                    <strong>Principal Business Activity:</strong><br>
                    ${escapeHtml(businessActivity)}
                </p>

                <p>
                    <strong>Registered Office Address:</strong><br>
                    ${escapeHtml(registeredAddress)}
                </p>

                <p>
                    <strong>Sub Category:</strong><br>
                    ${escapeHtml(subCategory)}
                </p>

            </div>

        `;


        return new Response(
            createPage(
                `${companyName || cin} - Company Details`,
                content,
                companyName || cinValue || cin,
                cinValue || cin
            ),
            {
                status: 200,
                headers: {
                    "content-type":
                        "text/html;charset=UTF-8",

                    "cache-control":
                        "public, max-age=3600"
                }
            }
        );

    } catch (error) {

        console.error(error);

        return new Response(
            createPage(
                "Company Lookup Error",
                `
                <h1>Company Lookup Error</h1>

                <p>
                    Unable to retrieve company information
                    right now. Please try again later.
                </p>
                `
            ),
            {
                status: 500,
                headers: {
                    "content-type":
                        "text/html;charset=UTF-8"
                }
            }
        );
    }
}


/*
 * ==========================================
 * GET FIELD
 * ==========================================
 */

function getField(object, field) {

    if (!object) {
        return "";
    }

    if (
        Object.prototype.hasOwnProperty.call(
            object,
            field
        )
    ) {
        return object[field] ?? "";
    }

    /*
     * Case-insensitive fallback
     */

    const key = Object.keys(object).find(function (key) {

        return key.toUpperCase() ===
            field.toUpperCase();

    });

    return key ? object[key] ?? "" : "";
}


/*
 * ==========================================
 * CREATE PAGE
 * ==========================================
 */

function createPage(
    title,
    content,
    companyName = "",
    cin = ""
) {

    const description =
        companyName && cin
            ? `${companyName} (${cin}) - Find company registration date, status, class, category, authorized capital, paid-up capital, registered state, ROC and company details.`
            : `${title} - Find company information, registration details, status, capital, registered state and ROC details.`;

    return `<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="google-site-verification"
        content="dDDf6n61Y6wtILH1Z-cim30ml4yMKMiZu5wJht9j-ko"
    >

    <meta
        name="robots"
        content="index, follow"
    >

    <meta
        name="description"
        content="${escapeHtml(description)}"
    >

    <link
        rel="icon"
        type="image/png"
        href="/favicon.png"
    >

    <title>
        ${escapeHtml(title)}
    </title>

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
            box-shadow:
                0 3px 12px rgba(0,0,0,.06);
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
            grid-template-columns:
                repeat(2, 1fr);

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

        .details p {
            margin: 14px 0;
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

            .box {
                padding: 18px;
            }

        }

    </style>

</head>

<body>

<div class="container">

    <div class="box">

        <p>
            <a href="/">
                ← Company Finder
            </a>
        </p>

        ${content}

    </div>

</div>

</body>

</html>`;
}


/*
 * ==========================================
 * ESCAPE HTML
 * ==========================================
 */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
