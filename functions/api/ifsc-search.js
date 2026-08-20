export async function onRequestGet(context) {

    const url =
        new URL(context.request.url);

    const bankcode =
        String(
            url.searchParams.get("bankcode") || ""
        )
        .trim()
        .toUpperCase();

    const state =
        String(
            url.searchParams.get("state") || ""
        )
        .trim()
        .toUpperCase();

    const city =
        String(
            url.searchParams.get("city") || ""
        )
        .trim();

    const limit =
        url.searchParams.get("limit") || "1000";


    try {

        const apiUrl =
            new URL(
                "https://ifsc.razorpay.com/search"
            );


        if (bankcode) {

            apiUrl.searchParams.set(
                "bankcode",
                bankcode
            );

        }


        if (state) {

            apiUrl.searchParams.set(
                "state",
                state
            );

        }


        if (city) {

            apiUrl.searchParams.set(
                "city",
                city
            );

        }


        apiUrl.searchParams.set(
            "limit",
            limit
        );


        const response =
            await fetch(
                apiUrl.toString(),
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            const text =
                await response.text();

            console.error(
                "Razorpay search error:",
                response.status,
                text
            );


            return new Response(
                JSON.stringify({
                    error:
                        "Unable to search IFSC data."
                }),
                {
                    status: 502,
                    headers: {
                        "content-type":
                            "application/json;charset=UTF-8"
                    }
                }
            );

        }


        const data =
            await response.json();


        return new Response(
            JSON.stringify(data),
            {
                status: 200,
                headers: {
                    "content-type":
                        "application/json;charset=UTF-8",

                    "cache-control":
                        "public, max-age=3600"
                }
            }
        );


    }
    catch(error) {

        console.error(
            "IFSC search function error:",
            error
        );


        return new Response(
            JSON.stringify({
                error:
                    "Unable to search IFSC data."
            }),
            {
                status: 500,
                headers: {
                    "content-type":
                        "application/json;charset=UTF-8"
                }
            }
        );

    }

}
