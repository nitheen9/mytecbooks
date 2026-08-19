export async function onRequestGet(context) {

    const cin = String(context.params.cin || "")
        .trim()
        .toUpperCase();

    /*
     * Basic CIN validation.
     * Allows normal Indian company CIN formats and LLP-style IDs
     * returned by the government dataset.
     */
    if (!/^[A-Z0-9-]{6,30}$/.test(cin)) {

        return new Response(
            createPage(
                "Invalid CIN",
                `
                <h1>Invalid CIN</h1>

                <p>
                    Please enter a valid Corporate Identification Number (CIN).
                </p>
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
     * ==========================================
     * API KEY
     * ==========================================
     *
     * Cloudflare Pages:
     *
     * Settings
     * → Variables and Secrets
     * → Add
     *
     * Name:
     * DATA_GOV_API_KEY
     *
     * Put your real API key there.
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
                    The company data service is not configured correctly.
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

        /*
         * ==========================================
         * DATA.GOV.IN API
         * ==========================================
         */

        const apiUrl =
            "https://api.data.gov.in/resource/" +
            "4dbe5667-7b6b-41d7-82af-211562424d9a" +
            "?api-key=" +
            encodeURIComponent(apiKey) +
            "&format=json" +
            "&limit=100";


        const response = await fetch(apiUrl, {
            headers: {
                "Accept": "application/json"
            }
        });


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
                        Unable to retrieve company information right now.
                        Please try again later.
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
         * API records are inside data.records
         */

        if (
            !data ||
            !Array.isArray(data.records)
        ) {

            return new Response(
                createPage(
                    "Company Not Found",
                    `
                    <h1>Company Not Found</h1>

                    <p>
                        No company information was found for
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
         * Find exact CIN.
         *
         * Also require CompanyStatus = Active.
         */

        const company = data.records.find(function (record) {

            const recordCin =
                String(record.CIN || "")
                    .trim()
                    .toUpperCase();

            const status =
                String(record.CompanyStatus || "")
                    .trim()
                    .toLowerCase();

            return (
                recordCin === cin &&
                status === "active"
            );

        });


        /*
         * Company not found or not Active
         */

        if (!company) {

            return new Response(
                createPage(
                    "Company Not Found",
                    `
                    <h1>Company Not Found</h1>

                    <p>
                        No active company information was found for
                        <strong>${escapeHtml(cin)}</strong>.
                    </p>

                    <p>
                        Only companies with
                        <strong>Company Status = Active</strong>
                        are displayed.
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
         * ==========================================
         * COMPANY DATA
         * ==========================================
         */

        const companyName =
            company.CompanyName || "Company";

        const registrationDate =
            company.CompanyRegistrationdate_date || "N/A";

        const companyStatus =
            company.CompanyStatus || "N/A";

        const companyClass =
            company.CompanyClass || "N/A";

        const companyCategory =
            company.CompanyCategory || "N/A";

        const companySubCategory =
            company.CompanySubCategory || "N/A";

        const authorizedCapital =
            company.AuthorizedCapital || "N/A";

        const paidupCapital =
            company.PaidupCapital || "N/A";

        const roc =
            company.CompanyROCcode || "N/A";

        const stateCode =
            company.CompanyStateCode || "N/A";

        const registeredAddress =
            company.Registered_Office_Address || "N/A";

        const listingStatus =
            company.Listingstatus || "N/A";

        const indianForeign =
            company["CompanyIndian/Foreign Company"] || "N/A";

        const nicCode =
            company.nic_code || "N/A";

        const industrialClassification =
            company.CompanyIndustrialClassification || "N/A";


        /*
         * ==========================================
         * PAGE CONTENT
         * ==========================================
         */

        const content = `

            <h1>
                🏢 ${escapeHtml(companyName)}
            </h1>

            <p>
                Company information for
                <strong>${escapeHtml(cin)}</strong>.
            </p>


            <div class="summary">

                <div>
                    <strong>CIN</strong><br>
                    ${escapeHtml(company.CIN || cin)}
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
                    <strong>Registration Date</strong><br>
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
                    <strong>ROC</strong><br>
                    ${escapeHtml(roc)}
                </div>

                <div>
                    <strong>State</strong><br>
                    ${escapeHtml(stateCode)}
                </div>

            </div>


            <div class="details">

                <h2>
                    Company Details
                </h2>

                <p>
                    <strong>CIN:</strong>
                    ${escapeHtml(company.CIN || cin)}
                </p>

                <p>
                    <strong>Company Name:</strong>
                    ${escapeHtml(companyName)}
                </p>

                <p>
                    <strong>Company Status:</strong>
                    ${escapeHtml(companyStatus)}
                </p>

                <p>
                    <strong>Company Class:</strong>
                    ${escapeHtml(companyClass)}
                </p>

                <p>
                    <strong>Company Category:</strong>
                    ${escapeHtml(companyCategory)}
                </p>

                <p>
                    <strong>Company Sub Category:</strong>
                    ${escapeHtml(companySubCategory)}
                </p>

                <p>
                    <strong>Authorized Capital:</strong>
                    ${escapeHtml(authorizedCapital)}
                </p>

                <p>
                    <strong>Paid-up Capital:</strong>
                    ${escapeHtml(paidupCapital)}
                </p>

                <p>
                    <strong>Registration Date:</strong>
                    ${escapeHtml(registrationDate)}
                </p>

                <p>
                    <strong>Registrar of Companies:</strong>
                    ${escapeHtml(roc)}
                </p>

                <p>
                    <strong>Registered State:</strong>
                    ${escapeHtml(stateCode)}
                </p>

                <p>
                    <strong>Listing Status:</strong>
                    ${escapeHtml(listingStatus)}
                </p>

                <p>
                    <strong>Indian / Foreign Company:</strong>
                    ${escapeHtml(indianForeign)}
                </p>

                <p>
                    <strong>NIC Code:</strong>
                    ${escapeHtml(nicCode)}
                </p>

                <p>
                    <strong>Industrial Classification:</strong>
                    ${escapeHtml(industrialClassification)}
                </p>

                <p>
                    <strong>Registered Office Address:</strong><br>
                    ${escapeHtml(registeredAddress)}
                </p>

            </div>

        `;


        /*
         * ==========================================
         * RETURN PAGE
         * ==========================================
         */

        return new Response(
            createPage(
                `${companyName} - ${cin} Company Details`,
                content,
                companyName,
                cin
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

        console.error(
            "Company API error:",
            error
        );


        return new Response(
            createPage(
                "Company Lookup Error",
                `
                <h1>Company Lookup Error</h1>

                <p>
                    Unable to retrieve company information right now.
                    Please try again later.
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
            ? `${companyName} (${cin}) - Find company status, registration date, ROC, registered office address, authorized capital, paid-up capital and company details.`
            : "Find Indian company information including CIN, company status, registration date, ROC, registered office address and company details.";


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
            box-shadow:
                0 2px 10px rgba(0,0,0,.05);
        }

        .details p {
            margin: 12px 0;
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
