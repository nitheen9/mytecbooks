export async function onRequest(context) {

    const SEC_URL =
        "https://www.sec.gov/files/company_tickers_exchange.json";


    try {

        const response =
            await fetch(
                SEC_URL,
                {
                    headers: {

                        "User-Agent":
                            "MyTecBooks mytecbooks.pages.dev contact@example.com",

                        "Accept":
                            "application/json",

                        "Accept-Encoding":
                            "gzip, deflate"

                    }
                }
            );


        if (!response.ok) {

            console.error(
                "SEC response:",
                response.status
            );


            return new Response(
                JSON.stringify({
                    error:
                        "SEC request failed",
                    status:
                        response.status
                }),
                {
                    status: 502,

                    headers: {
                        "Content-Type":
                            "application/json; charset=UTF-8"
                    }
                }
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            !Array.isArray(data.fields) ||
            !Array.isArray(data.data)
        ) {

            throw new Error(
                "Invalid SEC company data"
            );

        }


        return new Response(
            JSON.stringify(data),
            {
                status: 200,

                headers: {

                    "Content-Type":
                        "application/json; charset=UTF-8",

                    "Cache-Control":
                        "public, max-age=3600, s-maxage=86400",

                    "Access-Control-Allow-Origin":
                        "*"

                }

            }
        );

    }
    catch(error) {

        console.error(
            "SEC company list error:",
            error
        );


        return new Response(
            JSON.stringify({
                error:
                    "Unable to load SEC company database"
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
