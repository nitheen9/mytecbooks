export async function onRequestGet(context) {

    const url = new URL(context.request.url);

    const bankcode =
        String(url.searchParams.get("bankcode") || "")
            .trim()
            .toUpperCase();

    const state =
        String(url.searchParams.get("state") || "")
            .trim()
            .toUpperCase();

    const district =
        String(url.searchParams.get("district") || "")
            .trim();

    try {

        /*
         * ==========================================
         * RAZORPAY IFSC API
         * ==========================================
         */

        const apiUrl =
            new URL("https://ifsc.razorpay.com/places");

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

        if (district) {
            apiUrl.searchParams.set(
                "district",
                district
            );
        }


        console.log(
            "IFSC Places:",
            apiUrl.toString()
        );


        const response =
            await fetch(apiUrl.toString(), {
                headers: {
                    "Accept": "application/json"
                }
            });


        if (!response.ok) {

            const text =
                await response.text();

            console.error(
                "Razorpay IFSC error:",
                response.status,
                text
            );

            return new Response(
                JSON.stringify({
                    error:
                        "Unable to retrieve IFSC location data."
                }),
                {
                    status: 502,
                    headers: {
                        "content-type":
                            "application/json;charset=UTF-8",
                        "cache-control":
                            "no-store"
                    }
                }
            );
        }


        const data =
            await response.json();


        /*
         * ==========================================
         * RETURN DATA TO BROWSER
         * ==========================================
         */

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
    catch (error) {

        console.error(
            "IFSC Places Function Error:",
            error
        );

        return new Response(
            JSON.stringify({
                error:
                    "Unable to retrieve IFSC data."
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
