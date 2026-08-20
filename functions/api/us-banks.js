const FDIC_API =
    "https://banks.data.fdic.gov/api";

const STATES = [
    ["AL", "Alabama"],
    ["AK", "Alaska"],
    ["AZ", "Arizona"],
    ["AR", "Arkansas"],
    ["CA", "California"],
    ["CO", "Colorado"],
    ["CT", "Connecticut"],
    ["DE", "Delaware"],
    ["FL", "Florida"],
    ["GA", "Georgia"],
    ["HI", "Hawaii"],
    ["ID", "Idaho"],
    ["IL", "Illinois"],
    ["IN", "Indiana"],
    ["IA", "Iowa"],
    ["KS", "Kansas"],
    ["KY", "Kentucky"],
    ["LA", "Louisiana"],
    ["ME", "Maine"],
    ["MD", "Maryland"],
    ["MA", "Massachusetts"],
    ["MI", "Michigan"],
    ["MN", "Minnesota"],
    ["MS", "Mississippi"],
    ["MO", "Missouri"],
    ["MT", "Montana"],
    ["NE", "Nebraska"],
    ["NV", "Nevada"],
    ["NH", "New Hampshire"],
    ["NJ", "New Jersey"],
    ["NM", "New Mexico"],
    ["NY", "New York"],
    ["NC", "North Carolina"],
    ["ND", "North Dakota"],
    ["OH", "Ohio"],
    ["OK", "Oklahoma"],
    ["OR", "Oregon"],
    ["PA", "Pennsylvania"],
    ["RI", "Rhode Island"],
    ["SC", "South Carolina"],
    ["SD", "South Dakota"],
    ["TN", "Tennessee"],
    ["TX", "Texas"],
    ["UT", "Utah"],
    ["VT", "Vermont"],
    ["VA", "Virginia"],
    ["WA", "Washington"],
    ["WV", "West Virginia"],
    ["WI", "Wisconsin"],
    ["WY", "Wyoming"],
    ["DC", "District of Columbia"],
    ["PR", "Puerto Rico"],
    ["VI", "Virgin Islands"],
    ["GU", "Guam"],
    ["AS", "American Samoa"],
    ["MP", "Northern Mariana Islands"]
];


export async function onRequest(context) {

    const url =
        new URL(context.request.url);

    const type =
        url.searchParams.get("type");


    /* =====================================
       STATES
    ===================================== */

    if (type === "states") {

        return json({

            states: STATES.map(function(item) {

                return {
                    code: item[0],
                    name: item[1]
                };

            })

        });

    }


    /* =====================================
       CITIES
    ===================================== */

    if (type === "cities") {

        const state =
            url.searchParams.get("state");

        if (!state) {

            return json(
                { error: "State is required." },
                400
            );

        }


        const query =
            `STALP:"${escapeQuery(state)}"`;

        const data =
            await fdicRequest(
                "/locations",
                {
                    search: query,
                    limit: 10000,
                    fields:
                        "CITY,STALP"
                }
            );


        const cities =
            new Set();


        for (
            const item of data.data || []
        ) {

            if (item.CITY) {

                cities.add(
                    String(item.CITY).trim()
                );

            }

        }


        return json({

            cities:
                Array.from(cities)
                    .filter(Boolean)
                    .sort()

        });

    }


    /* =====================================
       BANKS
    ===================================== */

    if (type === "banks") {

        const state =
            url.searchParams.get("state");

        const city =
            url.searchParams.get("city");


        if (!state || !city) {

            return json(
                {
                    error:
                        "State and city are required."
                },
                400
            );

        }


        const query =
            `STALP:"${escapeQuery(state)}" AND CITY:"${escapeQuery(city)}"`;


        const data =
            await fdicRequest(
                "/locations",
                {
                    search: query,
                    limit: 10000,
                    fields:
                        "NAME,CERT,STALP,CITY"
                }
            );


        const banksMap =
            new Map();


        for (
            const item of data.data || []
        ) {

            const cert =
                String(
                    item.CERT || ""
                ).trim();

            const name =
                String(
                    item.NAME || ""
                ).trim();


            if (
                cert &&
                name
            ) {

                banksMap.set(
                    cert,
                    {
                        cert: cert,
                        name: name
                    }
                );

            }

        }


        const banks =
            Array.from(
                banksMap.values()
            );


        banks.sort(function(a, b) {

            return a.name.localeCompare(
                b.name
            );

        });


        return json({
            banks: banks
        });

    }


    /* =====================================
       BRANCHES
    ===================================== */

    if (type === "branches") {

        const state =
            url.searchParams.get("state");

        const city =
            url.searchParams.get("city");

        const cert =
            url.searchParams.get("cert");


        if (
            !state ||
            !city ||
            !cert
        ) {

            return json(
                {
                    error:
                        "State, city and certificate are required."
                },
                400
            );

        }


        const query =
            `STALP:"${escapeQuery(state)}" AND CITY:"${escapeQuery(city)}" AND CERT:${escapeQuery(cert)}`;


        const data =
            await fdicRequest(
                "/locations",
                {
                    search: query,
                    limit: 10000,
                    fields:
                        "ID,NAME,OFFNAME,STALP,CITY,ADDRESS,ZIP,COUNTY,CERT,SERVTYPE"
                }
            );


        const branches =
            [];


        for (
            const item of data.data || []
        ) {

            const id =
                String(
                    item.ID || ""
                ).trim();


            const name =
                String(
                    item.OFFNAME ||
                    item.NAME ||
                    ""
                ).trim();


            if (id) {

                branches.push({

                    id: id,

                    name:
                        name ||
                        "Bank Branch"

                });

            }

        }


        branches.sort(function(a, b) {

            return a.name.localeCompare(
                b.name
            );

        });


        return json({
            branches: branches
        });

    }


    /* =====================================
       SINGLE BRANCH
    ===================================== */

    if (type === "branch") {

        const id =
            url.searchParams.get("id");


        if (!id) {

            return json(
                {
                    error:
                        "Branch ID is required."
                },
                400
            );

        }


        const query =
            `ID:${escapeQuery(id)}`;


        const data =
            await fdicRequest(
                "/locations",
                {
                    search: query,
                    limit: 1,
                    fields:
                        "ID,NAME,OFFNAME,STALP,CITY,ADDRESS,ZIP,COUNTY,CERT,SERVTYPE"
                }
            );


        const item =
            data.data &&
            data.data.length
                ? data.data[0]
                : null;


        if (!item) {

            return json(
                {
                    error:
                        "Branch not found."
                },
                404
            );

        }


        return json({

            branch: {

                id:
                    item.ID || "",

                bankName:
                    item.NAME || "",

                branchName:
                    item.OFFNAME ||
                    item.NAME ||
                    "",

                address:
                    item.ADDRESS || "",

                city:
                    item.CITY || "",

                state:
                    item.STALP || "",

                zip:
                    item.ZIP || "",

                county:
                    item.COUNTY || "",

                cert:
                    item.CERT || "",

                branchType:
                    item.OFFNAME
                        ? "Branch / Office"
                        : "Main Office",

                serviceType:
                    item.SERVTYPE || ""

            }

        });

    }


    return json(
        {
            error:
                "Invalid request type."
        },
        400
    );

}


/* =========================================
   FDIC REQUEST
========================================= */

async function fdicRequest(
    endpoint,
    params
) {

    const apiUrl =
        new URL(
            FDIC_API + endpoint
        );


    apiUrl.searchParams.set(
        "format",
        "json"
    );


    for (
        const key in params
    ) {

        apiUrl.searchParams.set(
            key,
            params[key]
        );

    }


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

        throw new Error(
            "FDIC API returned HTTP " +
            response.status
        );

    }


    return await response.json();

}


/* =========================================
   QUERY ESCAPE
========================================= */

function escapeQuery(value) {

    return String(value || "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');

}


/* =========================================
   JSON RESPONSE
========================================= */

function json(
    data,
    status = 200
) {

    return new Response(
        JSON.stringify(data),
        {
            status: status,

            headers: {
                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600"
            }
        }
    );

}
