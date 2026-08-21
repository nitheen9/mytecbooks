export async function onRequest(context) {

    const SEC_URL =
        "https://www.sec.gov/files/company_tickers_exchange.json";

    try {

        const response = await fetch(
            SEC_URL,
            {
                headers: {
                    "User-Agent":
                        "MyTecBooks SEC Company Finder admin@mytecbooks.pages.dev"
                }
            }
        );

        if (!response.ok) {

            throw new Error(
                "SEC returned HTTP " +
                response.status
            );

        }

        const data =
            await response.json();


        /*
            SEC format:

            {
                fields: [
                    "cik",
                    "name",
                    "ticker",
                    "exchange"
                ],

                data: [
                    [1045810, "Company Name", "TICKER", "Exchange"]
                ]
            }
        */


        if (
            !data ||
            !Array.isArray(data.fields) ||
            !Array.isArray(data.data)
        ) {

            throw new Error(
                "Unexpected SEC data format"
            );

        }


        const fields =
            data.fields;


        const companies =
            data.data.map(
                function(row) {

                    const company = {};


                    fields.forEach(
                        function(field, index) {

                            company[field] =
                                row[index];

                        }
                    );


                    return {

                        cik:
                            String(
                                company.cik ??
                                ""
                            ),

                        name:
                            String(
                                company.name ??
                                ""
                            ),

                        ticker:
                            String(
                                company.ticker ??
                                ""
                            ),

                        exchange:
                            String(
                                company.exchange ??
                                ""
                            )

                    };

                }
            );


        /*
            Remove records without
            a company name.
        */

        const validCompanies =
            companies.filter(
                function(company) {

                    return (
                        company.name &&
                        company.name.trim()
                    );

                }
            );


        /*
            Sort alphabetically
        */

        validCompanies.sort(
            function(a, b) {

                return a.name.localeCompare(
                    b.name
                );

            }
        );


        return new Response(
            JSON.stringify(
                validCompanies
            ),
            {
                status: 200,

                headers: {

                    "Content-Type":
                        "application/json; charset=UTF-8",

                    "Cache-Control":
                        "public, max-age=3600, s-maxage=86400"

                }

            }
        );

    }
    catch (error) {

        console.error(
            "SEC company error:",
            error
        );


        return new Response(
            JSON.stringify({

                error:
                    "Unable to load SEC company data."

            }),
            {
                status: 500,

                headers: {

                    "Content-Type":
                        "application/json; charset=UTF-8",

                    "Cache-Control":
                        "no-cache"

                }

            }
        );

    }

}
