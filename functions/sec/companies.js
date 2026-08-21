export async function onRequest(context) {

    try {

        const response = await fetch(
            "https://www.sec.gov/files/company_tickers_exchange.json",
            {
                headers: {
                    "User-Agent":
                        "MyTecBooks mytecbooks.pages.dev contact@mytecbooks.pages.dev",
                    "Accept":
                        "application/json"
                }
            }
        );

        if (!response.ok) {

            return new Response(
                JSON.stringify({
                    error: "SEC API request failed",
                    status: response.status
                }),
                {
                    status: response.status,
                    headers: {
                        "Content-Type":
                            "application/json; charset=UTF-8",
                        "Cache-Control":
                            "public, max-age=3600"
                    }
                }
            );
        }

        const data = await response.json();

        return new Response(
            JSON.stringify(data),
            {
                status: 200,
                headers: {
                    "Content-Type":
                        "application/json; charset=UTF-8",

                    "Access-Control-Allow-Origin":
                        "*",

                    "Cache-Control":
                        "public, max-age=3600, s-maxage=86400"
                }
            }
        );

    }
    catch (error) {

        console.error(
            "SEC company API error:",
            error
        );

        return new Response(
            JSON.stringify({
                error: "Unable to load SEC company data."
            }),
            {
                status: 500,
                headers: {
                    "Content-Type":
                        "application/json; charset=UTF-8"
                }
            }
        );
    }
}
