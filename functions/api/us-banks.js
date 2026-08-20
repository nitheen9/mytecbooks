const FDIC_BASE = "https://banks.data.fdic.gov/api";

const STATES = {
    AL: "Alabama",
    AK: "Alaska",
    AZ: "Arizona",
    AR: "Arkansas",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    IA: "Iowa",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    ME: "Maine",
    MD: "Maryland",
    MA: "Massachusetts",
    MI: "Michigan",
    MN: "Minnesota",
    MS: "Mississippi",
    MO: "Missouri",
    MT: "Montana",
    NE: "Nebraska",
    NV: "Nevada",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NY: "New York",
    NC: "North Carolina",
    ND: "North Dakota",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    SD: "South Dakota",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VT: "Vermont",
    VA: "Virginia",
    WA: "Washington",
    WV: "West Virginia",
    WI: "Wisconsin",
    WY: "Wyoming",
    DC: "District of Columbia",
    PR: "Puerto Rico",
    VI: "Virgin Islands",
    GU: "Guam",
    AS: "American Samoa",
    MP: "Northern Mariana Islands"
};


export async function onRequest(context) {

    const url =
        new URL(context.request.url);

    const type =
        url.searchParams.get("type");


    try {

        /* ============================
           BANKS
        ============================ */

        if (type === "banks") {

            return await getBanks();
        }


        /* ============================
           STATES
        ============================ */

        if (type === "states") {

            const cert =
                url.searchParams.get("cert");

            return await getStates(cert);
        }


        /* ============================
           CITIES
        ============================ */

        if (type === "cities") {

            const cert =
                url.searchParams.get("cert");

            const state =
                url.searchParams.get("state");

            return await getCities(
                cert,
                state
            );
        }


        /* ============================
           BRANCHES
        ============================ */

        if (type === "branches") {

            const cert =
                url.searchParams.get("cert");

            const state =
                url.searchParams.get("state");

            const city =
                url.searchParams.get("city");

            return await getBranches(
                cert,
                state,
                city
            );
        }


        /* ============================
           BRANCH DETAILS
        ============================ */

        if (type === "branch") {

            const id =
                url.searchParams.get("id");

            return await getBranch(id);
        }


        return response({
            error:
                "Invalid type."
        }, 400);

    }
    catch (error) {

        console.error(error);

        return response({
            error:
                error.message ||
                "FDIC API error."
        }, 500);
    }
}


/* =====================================
   GET BANKS
===================================== */

async function getBanks() {

    const data =
        await fdicRequest(
            "/institutions",
            {
                fields:
                    "CERT,NAME,CITY,STALP",

                limit:
                    10000,

                offset:
                    0,

                sort:
                    "NAME:asc"
            }
        );


    const banks = [];


    for (
        const item of
        data.data || []
    ) {

        const cert =
            item.CERT;

        const name =
            item.NAME;


        if (
            cert === undefined ||
            !name
        ) {

            continue;
        }


        banks.push({

            cert:
                String(cert),

            name:
                String(name),

            city:
                String(
                    item.CITY || ""
                ),

            state:
                String(
                    item.STALP || ""
                )
        });
    }


    return response({

        count:
            banks.length,

        banks:
            banks

    });
}


/* =====================================
   GET STATES
===================================== */

async function getStates(cert) {

    if (!cert) {

        return response({
            error:
                "cert is required."
        }, 400);
    }


    const data =
        await fdicRequest(
            "/locations",
            {
                filters:
                    `CERT:${cert}`,

                fields:
                    "STALP",

                limit:
                    10000,

                offset:
                    0
            }
        );


    const set =
        new Set();


    for (
        const item of
        data.data || []
    ) {

        const state =
            String(
                item.STALP || ""
            )
            .trim()
            .toUpperCase();


        if (state) {

            set.add(state);
        }
    }


    const states =
        Array.from(set)
        .sort()
        .map(
            code => ({

                code:
                    code,

                name:
                    STATES[code] ||
                    code

            })
        );


    return response({

        cert:
            String(cert),

        count:
            states.length,

        states:
            states
    });
}


/* =====================================
   GET CITIES
===================================== */

async function getCities(
    cert,
    state
) {

    if (
        !cert ||
        !state
    ) {

        return response({
            error:
                "cert and state are required."
        }, 400);
    }


    const stateCode =
        String(state)
        .trim()
        .toUpperCase();


    const data =
        await fdicRequest(
            "/locations",
            {
                filters:
                    `CERT:${cert} AND STALP:${stateCode}`,

                fields:
                    "CITY",

                limit:
                    10000,

                offset:
                    0
            }
        );


    const set =
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

            set.add(city);
        }
    }


    const cities =
        Array.from(set)
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );


    return response({

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


/* =====================================
   GET BRANCHES
===================================== */

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

        return response({
            error:
                "cert, state and city are required."
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
        `CERT:${cert} AND ` +
        `STALP:${stateCode} AND ` +
        `CITY:"${cityName}"`;


    const data =
        await fdicRequest(
            "/locations",
            {
                filters:
                    filters,

                fields:
                    [
                        "ID",
                        "CERT",
                        "NAME",
                        "OFFNAME",
                        "ADDRESS",
                        "CITY",
                        "STALP",
                        "ZIP"
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

        if (
            item.ID === undefined
        ) {

            continue;
        }


        branches.push({

            id:
                String(item.ID),

            name:
                String(
                    item.OFFNAME ||
                    item.NAME ||
                    "Branch"
                ),

            address:
                String(
                    item.ADDRESS || ""
                ),

            city:
                String(
                    item.CITY || ""
                ),

            state:
                String(
                    item.STALP || ""
                ),

            zip:
                String(
                    item.ZIP || ""
                ),

            cert:
                String(
                    item.CERT || cert
                )
        });
    }


    branches.sort(
        (a, b) =>
            a.name.localeCompare(
                b.name
            )
    );


    return response({

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


/* =====================================
   BRANCH DETAILS
===================================== */

async function getBranch(id) {

    if (!id) {

        return response({
            error:
                "id is required."
        }, 400);
    }


    const data =
        await fdicRequest(
            "/locations",
            {
                filters:
                    `ID:${id}`,

                limit:
                    1,

                offset:
                    0
            }
        );


    if (
        !data.data ||
        data.data.length === 0
    ) {

        return response({
            error:
                "Branch not found."
        }, 404);
    }


    const item =
        data.data[0];


    return response({

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

            cert:
                item.CERT || "",

            county:
                item.COUNTY || "",

            serviceType:
                item.SERVTYPE || ""
        }

    });
}


/* =====================================
   FDIC API REQUEST
===================================== */

async function fdicRequest(
    endpoint,
    params
) {

    const apiUrl =
        new URL(
            FDIC_BASE +
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
            String(params[key])
        );
    }


    console.log(
        "FDIC REQUEST:",
        apiUrl.toString()
    );


    const result =
        await fetch(
            apiUrl.toString(),
            {
                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );


    const text =
        await result.text();


    console.log(
        "FDIC STATUS:",
        result.status
    );


    if (!result.ok) {

        console.error(
            text.substring(
                0,
                1000
            )
        );

        throw new Error(
            "FDIC returned HTTP " +
            result.status
        );
    }


    let jsonData;


    try {

        jsonData =
            JSON.parse(text);

    }
    catch {

        console.error(
            text.substring(
                0,
                1000
            )
        );

        throw new Error(
            "FDIC did not return JSON."
        );
    }


    return jsonData;
}


/* =====================================
   RESPONSE
===================================== */

function response(
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
