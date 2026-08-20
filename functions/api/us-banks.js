import { getUSCities } from "../data/us-cities.js";

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

    try {

        /* ==============================
           BANK LIST
        ============================== */

        if (type === "banks") {
            return await getBanks();
        }


        /* ==============================
           STATES FOR SELECTED BANK
        ============================== */

        if (type === "states") {

            const cert =
                url.searchParams.get("cert");

            return await getBankStates(cert);
        }


        /* ==============================
           CITIES
        ============================== */

        if (type === "cities") {

            const cert =
                url.searchParams.get("cert");

            const state =
                url.searchParams.get("state");

            return await getBankCities(
                cert,
                state
            );
        }


        /* ==============================
           BRANCHES
        ============================== */

        if (type === "branches") {

            const cert =
                url.searchParams.get("cert");

            const state =
                url.searchParams.get("state");

            const city =
                url.searchParams.get("city");

            return await getBankBranches(
                cert,
                state,
                city
            );
        }


        /* ==============================
           BRANCH DETAILS
        ============================== */

        if (type === "branch") {

            const id =
                url.searchParams.get("id");

            return await getBranchDetails(id);
        }


        return json({
            error: "Invalid API type."
        }, 400);

    }
    catch (error) {

        console.error(
            "US BANK API ERROR:",
            error
        );

        return json({
            error:
                error.message ||
                "Unable to load bank data."
        }, 500);
    }
}


/* ======================================
   BANKS
====================================== */

async function getBanks() {

    const data = await fdic(
        "/institutions",
        {
            fields:
                "NAME,CERT,CITY,STALP",

            limit:
                10000,

            offset:
                0
        }
    );


    const map = new Map();


    for (
        const item of
        data.data || []
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
            !cert ||
            !name
        ) {
            continue;
        }


        if (!map.has(cert)) {

            map.set(
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
            map.values()
        );


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


/* ======================================
   STATES FOR BANK
====================================== */

async function getBankStates(cert) {

    if (!cert) {

        return json({
            error:
                "Bank certificate is required."
        }, 400);
    }


    const data = await fdic(
        "/locations",
        {
            filters:
                `CERT:${escapeFilter(cert)}`,

            fields:
                "STALP",

            limit:
                10000,

            offset:
                0
        }
    );


    const states =
        new Set();


    for (
        const item of
        data.data || []
    ) {

        const state =
            String(
                item.STALP || ""
            ).trim().toUpperCase();


        if (state) {
            states.add(state);
        }
    }


    const result =
        Array.from(states);


    result.sort();


    const stateObjects =
        result.map(
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
            stateObjects.length,

        states:
            stateObjects
    });
}


/* ======================================
   CITIES FOR BANK + STATE
====================================== */

async function getBankCities(
    cert,
    state
) {

    if (!cert || !state) {

        return json({
            error:
                "Bank and state are required."
        }, 400);
    }


    const stateCode =
        String(state)
            .trim()
            .toUpperCase();


    /*
     * We use the local city dataset here.
     * This avoids the FDIC city query problem.
     */

    const allCities =
        await getUSCities();


    const citySet =
        new Set();


    for (
        const item of
        allCities
    ) {

        if (
            item.state ===
            stateCode
        ) {

            citySet.add(
                item.city
            );
        }
    }


    /*
     * Now ask FDIC for the selected bank's
     * actual locations in this state.
     */

    const data = await fdic(
        "/locations",
        {
            filters:
                `CERT:${escapeFilter(cert)} AND STALP:${stateCode}`,

            fields:
                "CITY",

            limit:
                10000,

            offset:
                0
        }
    );


    const bankCities =
        new Set();


    for (
        const item of
        data.data || []
    ) {

        const city =
            String(
                item.CITY || ""
            ).trim();


        if (city) {

            bankCities.add(
                city.toUpperCase()
            );
        }
    }


    /*
     * Match FDIC cities against the
     * local city names.
     */

    const result = [];


    for (
        const city of
        citySet
    ) {

        if (
            bankCities.has(
                city.toUpperCase()
            )
        ) {

            result.push(city);
        }
    }


    result.sort(
        (a, b) =>
            a.localeCompare(b)
    );


    return json({

        cert:
            String(cert),

        state:
            stateCode,

        count:
            result.length,

        cities:
            result
    });
}


/* ======================================
   BRANCHES
====================================== */

async function getBankBranches(
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


    const filters =
        [
            `CERT:${escapeFilter(cert)}`,
            `STALP:${stateCode}`,
            `CITY:"${escapeFilter(cityName)}"`
        ].join(" AND ");


    const data = await fdic(
        "/locations",
        {
            filters:
                filters,

            fields:
                [
                    "ID",
                    "NAME",
                    "OFFNAME",
                    "ADDRESS",
                    "CITY",
                    "STALP",
                    "ZIP",
                    "CERT"
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
        data.data || []
    ) {

        const id =
            String(
                item.ID || ""
            ).trim();


        if (!id) {
            continue;
        }


        branches.push({

            id:
                id,

            name:
                String(
                    item.OFFNAME ||
                    item.NAME ||
                    "Bank Branch"
                ).trim(),

            address:
                String(
                    item.ADDRESS || ""
                ).trim(),

            city:
                String(
                    item.CITY || ""
                ).trim(),

            state:
                String(
                    item.STALP || ""
                ).trim(),

            zip:
                String(
                    item.ZIP || ""
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


/* ======================================
   BRANCH DETAILS
====================================== */

async function getBranchDetails(id) {

    if (!id) {

        return json({
            error:
                "Branch ID is required."
        }, 400);
    }


    const data = await fdic(
        "/locations",
        {
            filters:
                `ID:${escapeFilter(id)}`,

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


    if (
        !data.data ||
        data.data.length === 0
    ) {

        return json({
            error:
                "Branch not found."
        }, 404);
    }


    const item =
        data.data[0];


    return json({

        branch: {

            id:
                item.ID || "",

            bank:
                item.NAME || "",

            branch:
                item.OFFNAME ||
                "",

            address:
                item.ADDRESS ||
                "",

            city:
                item.CITY ||
                "",

            state:
                item.STALP ||
                "",

            zip:
                item.ZIP ||
                "",

            county:
                item.COUNTY ||
                "",

            cert:
                item.CERT ||
                "",

            serviceType:
                item.SERVTYPE ||
                ""
        }
    });
}


/* ======================================
   FDIC REQUEST
====================================== */

async function fdic(
    endpoint,
    params
) {

    const url =
        new URL(
            FDIC_API +
            endpoint
        );


    url.searchParams.set(
        "format",
        "json"
    );


    for (
        const key in params
    ) {

        url.searchParams.set(
            key,
            String(params[key])
        );
    }


    console.log(
        "FDIC:",
        url.toString()
    );


    const response =
        await fetch(
            url.toString(),
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
            text.substring(
                0,
                1000
            )
        );


        throw new Error(
            "FDIC API HTTP " +
            response.status
        );
    }


    try {

        return JSON.parse(
            text
        );

    }
    catch {

        throw new Error(
            "FDIC returned invalid JSON."
        );
    }
}


/* ======================================
   ESCAPE
====================================== */

function escapeFilter(value) {

    return String(
        value || ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /"/g,
            '\\"'
        );
}


/* ======================================
   JSON RESPONSE
====================================== */

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
