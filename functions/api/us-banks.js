const FDIC_API = "https://api.fdic.gov/banks";

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

    try {

        if (type === "banks") {
            return await getBanks();
        }

        if (type === "states") {

            return await getStates(
                url.searchParams.get("cert")
            );
        }

        if (type === "cities") {

            return await getCities(
                url.searchParams.get("cert"),
                url.searchParams.get("state")
            );
        }

        if (type === "branches") {

            return await getBranches(
                url.searchParams.get("cert"),
                url.searchParams.get("state"),
                url.searchParams.get("city")
            );
        }

        if (type === "branch") {

            return await getBranch(
                url.searchParams.get("id")
            );
        }

        return json({
            error: "Invalid type."
        }, 400);

    }
    catch (error) {

        console.error("US BANK API ERROR:", error);

        return json({
            error:
                error.message ||
                "Unable to load U.S. bank data."
        }, 500);
    }
}


/* =========================================
   BANKS
========================================= */

async function getBanks() {

    const data = await fdicRequest(
        "/institutions",
        {
            fields:
                "CERT,NAME,CITY,STALP,ACTIVE",

            filters:
                "ACTIVE:1",

            limit:
                5000,

            offset:
                0,

            sort_by:
                "NAME",

            sort_order:
                "ASC"
        }
    );


    const banks = [];

    const seen = new Set();


    for (
        const item of
        extractRows(data)
    ) {

        const cert =
            String(
                item.CERT ?? ""
            ).trim();

        const name =
            String(
                item.NAME ?? ""
            ).trim();


        if (
            !cert ||
            !name ||
            seen.has(cert)
        ) {
            continue;
        }


        seen.add(cert);


        banks.push({

            cert: cert,

            name: name,

            city:
                String(
                    item.CITY ?? ""
                ).trim(),

            state:
                String(
                    item.STALP ?? ""
                ).trim()

        });
    }


    banks.sort(
        (a, b) =>
            a.name.localeCompare(
                b.name
            )
    );


    return json({

        count:
            banks.length,

        banks:
            banks

    });
}


/* =========================================
   STATES FOR SELECTED BANK
========================================= */

async function getStates(cert) {

    if (!cert) {

        return json({
            error:
                "Bank certificate is required."
        }, 400);
    }


    const data = await fdicRequest(
        "/locations",
        {
            search:
                `CERT:${escapeQuery(cert)}`,

            fields:
                "CERT,STALP",

            limit:
                10000,

            offset:
                0
        }
    );


    const stateSet =
        new Set();


    for (
        const item of
        extractRows(data)
    ) {

        const state =
            String(
                item.STALP ?? ""
            )
            .trim()
            .toUpperCase();


        if (state) {
            stateSet.add(state);
        }
    }


    const states =
        Array.from(
            stateSet
        )
        .sort()
        .map(
            code => {

                const found =
                    STATES.find(
                        x =>
                            x[0] === code
                    );


                return {

                    code: code,

                    name:
                        found
                            ? found[1]
                            : code

                };
            }
        );


    return json({

        cert:
            String(cert),

        count:
            states.length,

        states:
            states

    });
}


/* =========================================
   CITIES FOR BANK + STATE
========================================= */

async function getCities(
    cert,
    state
) {

    if (
        !cert ||
        !state
    ) {

        return json({
            error:
                "Bank and state are required."
        }, 400);
    }


    const stateCode =
        String(state)
            .trim()
            .toUpperCase();


    const data = await fdicRequest(
        "/locations",
        {
            search:
                `CERT:${escapeQuery(cert)} AND STALP:${escapeQuery(stateCode)}`,

            fields:
                "CERT,CITY,STALP",

            limit:
                10000,

            offset:
                0
        }
    );


    const cityMap =
        new Map();


    for (
        const item of
        extractRows(data)
    ) {

        const city =
            String(
                item.CITY ?? ""
            ).trim();


        if (!city) {
            continue;
        }


        const key =
            city.toUpperCase();


        if (!cityMap.has(key)) {

            cityMap.set(
                key,
                city
            );
        }
    }


    const cities =
        Array.from(
            cityMap.values()
        );


    cities.sort(
        (a, b) =>
            a.localeCompare(
                b
            )
    );


    return json({

        cert:
            String(cert),

        state:
            stateCode,

        count:
            cities.length,

        cities:
            cities

    });
}


/* =========================================
   BRANCHES
========================================= */

async function getBranches(
    cert,
    state,
    city
) {

    if (
        !cert ||
        !state ||
        !city
    ) {

        return json({
            error:
                "Bank, state and city are required."
        }, 400);
    }


    const stateCode =
        String(state)
            .trim()
            .toUpperCase();


    const cityName =
        String(city)
            .trim();


    const data = await fdicRequest(
        "/locations",
        {
            search:
                `CERT:${escapeQuery(cert)} AND STALP:${escapeQuery(stateCode)} AND CITY:${escapeQuery(cityName)}`,

            fields:
                [
                    "ID",
                    "CERT",
                    "NAME",
                    "OFFNAME",
                    "ADDRESS",
                    "CITY",
                    "STALP",
                    "ZIP",
                    "COUNTY",
                    "SERVTYPE"
                ].join(","),

            limit:
                10000,

            offset:
                0
        }
    );


    const branches = [];


    for (
        const item of
        extractRows(data)
    ) {

        const id =
            String(
                item.ID ?? ""
            ).trim();


        if (!id) {
            continue;
        }


        branches.push({

            id: id,

            name:
                String(
                    item.OFFNAME ||
                    item.NAME ||
                    "Bank Branch"
                ).trim(),

            address:
                String(
                    item.ADDRESS ||
                    ""
                ).trim(),

            city:
                String(
                    item.CITY ||
                    ""
                ).trim(),

            state:
                String(
                    item.STALP ||
                    ""
                ).trim(),

            zip:
                String(
                    item.ZIP ||
                    ""
                ).trim(),

            county:
                String(
                    item.COUNTY ||
                    ""
                ).trim(),

            serviceType:
                String(
                    item.SERVTYPE ||
                    ""
                ).trim()

        });
    }


    branches.sort(
        (a, b) =>
            a.name.localeCompare(
                b.name
            )
    );


    return json({

        cert:
            String(cert),

        state:
            stateCode,

        city:
            cityName,

        count:
            branches.length,

        branches:
            branches

    });
}


/* =========================================
   SINGLE BRANCH
========================================= */

async function getBranch(id) {

    if (!id) {

        return json({
            error:
                "Branch ID is required."
        }, 400);
    }


    const data = await fdicRequest(
        "/locations",
        {
            search:
                `ID:${escapeQuery(id)}`,

            fields:
                [
                    "ID",
                    "NAME",
                    "OFFNAME",
                    "ADDRESS",
                    "CITY",
                    "STALP",
                    "ZIP",
                    "COUNTY",
                    "CERT",
                    "SERVTYPE"
                ].join(","),

            limit:
                1
        }
    );


    const rows =
        extractRows(data);


    if (
        rows.length === 0
    ) {

        return json({
            error:
                "Branch not found."
        }, 404);
    }


    const item =
        rows[0];


    return json({

        branch: {

            id:
                item.ID || "",

            bank:
                item.NAME || "",

            branch:
                item.OFFNAME || "",

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

            serviceType:
                item.SERVTYPE || ""

        }

    });
}


/* =========================================
   FDIC API REQUEST
========================================= */

async function fdicRequest(
    endpoint,
    params
) {

    const apiUrl =
        new URL(
            FDIC_API +
            endpoint
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
            String(
                params[key]
            )
        );
    }


    console.log(
        "FDIC REQUEST:",
        apiUrl.toString()
    );


    const response =
        await fetch(
            apiUrl.toString(),
            {
                method:
                    "GET",

                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );


    const text =
        await response.text();


    if (!response.ok) {

        console.error(
            "FDIC ERROR:",
            response.status,
            text.substring(
                0,
                1000
            )
        );


        throw new Error(
            "FDIC API returned HTTP " +
            response.status
        );
    }


    try {

        return JSON.parse(
            text
        );

    }
    catch (error) {

        console.error(
            "FDIC NON-JSON:",
            text.substring(
                0,
                1000
            )
        );


        throw new Error(
            "FDIC returned invalid JSON."
        );
    }
}


/* =========================================
   RESPONSE DATA HELPER
========================================= */

function extractRows(data) {

    /*
     * Current FDIC API responses are normally
     * available in data, but this helper also
     * handles a nested data.data response.
     */

    if (
        data &&
        Array.isArray(data.data)
    ) {

        return data.data;
    }


    if (
        data &&
        data.data &&
        Array.isArray(
            data.data.data
        )
    ) {

        return data.data.data;
    }


    return [];
}


/* =========================================
   FILTER ESCAPE
========================================= */

function escapeQuery(value) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /"/g,
            '\\"'
        );
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
            status:
                status,

            headers: {

                "Content-Type":
                    "application/json; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=3600",

                "Access-Control-Allow-Origin":
                    "*"

            }
        }
    );
}
