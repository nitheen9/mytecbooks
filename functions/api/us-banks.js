const FDIC_API = "https://banks.data.fdic.gov/api";

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

    const url = new URL(context.request.url);
    const type = url.searchParams.get("type");


    /* =====================================
       STATES
    ===================================== */

    if (type === "states") {

        return json({
            states: STATES.map(function (item) {
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

        const state = url.searchParams.get("state");

        if (!state) {
            return json({
                error: "State is required."
            }, 400);
        }

        const data = await fdicRequest(
            "/locations",
            {
                filters: `STALP:${state}`,
                fields: "CITY,STALP",
                limit: 10000,
                offset: 0
            }
        );

        const citySet = new Set();

        for (const item of data.data || []) {

            const city =
                String(item.CITY || "").trim();

            if (city) {
                citySet.add(city);
            }
        }

        const cities =
            Array.from(citySet).sort(function (a, b) {
                return a.localeCompare(b);
            });

        return json({
            cities: cities
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

            return json({
                error:
                    "State and city are required."
            }, 400);

        }

        const data = await fdicRequest(
            "/locations",
            {
                filters:
                    `STALP:${state} AND CITY:"${escapeFilter(city)}"`,

                fields:
                    "NAME,CERT,CITY,STALP",

                limit: 10000,

                offset: 0
            }
        );


        const bankMap = new Map();

        for (const item of data.data || []) {

            const cert =
                String(item.CERT || "").trim();

            const name =
                String(item.NAME || "").trim();

            if (cert && name) {

                bankMap.set(
                    cert,
                    {
                        cert: cert,
                        name: name
                    }
                );

            }
        }


        const banks =
            Array.from(bankMap.values())
                .sort(function (a, b) {

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


        if (!state || !city || !cert) {

            return json({
                error:
                    "State, city and bank are required."
            }, 400);

        }


        const data = await fdicRequest(
            "/locations",
            {
                filters:
                    `STALP:${state} AND CITY:"${escapeFilter(city)}" AND CERT:${cert}`,

                fields:
                    "ID,NAME,OFFNAME,CITY,STALP,ADDRESS,ZIP,COUNTY,CERT,SERVTYPE",

                limit: 10000,

                offset: 0
            }
        );


        const branches = [];


        for (const item of data.data || []) {

            const id =
                String(item.ID || "").trim();

            const branchName =
                String(
                    item.OFFNAME ||
                    item.NAME ||
                    ""
                ).trim();


            if (id) {

                branches.push({
                    id: id,
                    name:
                        branchName ||
                        "Bank Branch"
                });

            }
        }


        branches.sort(function (a, b) {

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

            return json({
                error:
                    "Branch ID is required."
            }, 400);

        }


        const data = await fdicRequest(
            "/locations",
            {
                filters:
                    `ID:${escapeFilter(id)}`,

                fields:
                    "ID,NAME,OFFNAME,CITY,STALP,ADDRESS,ZIP,COUNTY,CERT,SERVTYPE",

                limit: 1,

                offset: 0
            }
        );


        const item =
            data.data &&
            data.data.length
                ? data.data[0]
                : null;


        if (!item) {

            return json({
                error:
                    "Branch not found."
            }, 404);

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
                    "Branch / Office",

                serviceType:
                    item.SERVTYPE || ""
            }

        });

    }


    return json({
        error:
            "Invalid request type."
    }, 400);

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


    for (const key in params) {

        apiUrl.searchParams.set(
            key,
            String(params[key])
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

        const text =
            await response.text();

        console.error(
            "FDIC API Error:",
            response.status,
            text
        );

        throw new Error(
            "FDIC API error " +
            response.status
        );

    }


    return await response.json();

}


/* =========================================
   ESCAPE FILTER
========================================= */

function escapeFilter(value) {

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
