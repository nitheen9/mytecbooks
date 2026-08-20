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
    ["PR", "Puerto Rico"]
];

export async function onRequest(context) {

    const url = new URL(context.request.url);
    const type = url.searchParams.get("type");

    try {

        if (type === "banks") {
            return await loadBanks();
        }

        if (type === "states") {
            return await loadStates(
                url.searchParams.get("cert")
            );
        }

        if (type === "cities") {
            return await loadCities(
                url.searchParams.get("cert"),
                url.searchParams.get("state")
            );
        }

        if (type === "branches") {
            return await loadBranches(
                url.searchParams.get("cert"),
                url.searchParams.get("state"),
                url.searchParams.get("city")
            );
        }

        if (type === "branch") {
            return await loadBranch(
                url.searchParams.get("id")
            );
        }

        return json({
            error: "Invalid type."
        }, 400);

    } catch (error) {

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

async function loadBanks() {

    const result = await fdicRequest(
        "/institutions",
        {
            fields:
                "NAME,CERT,CITY,STNAME,ACTIVE",

            filters:
                "ACTIVE:1",

            limit:
                1000,

            offset:
                0,

            format:
                "json"
        }
    );

    const rows = extractRows(result);

    const map = new Map();

    for (const item of rows) {

        const cert =
            String(item.CERT ?? "").trim();

        const name =
            String(item.NAME ?? "").trim();

        if (!cert || !name) {
            continue;
        }

        if (!map.has(cert)) {

            map.set(cert, {
                cert: cert,
                name: name,
                city:
                    String(
                        item.CITY ?? ""
                    ).trim(),
                state:
                    String(
                        item.STNAME ?? ""
                    ).trim()
            });
        }
    }

    const banks =
        Array.from(map.values());

    banks.sort(
        (a, b) =>
            a.name.localeCompare(b.name)
    );

    return json({
        count: banks.length,
        banks: banks
    });
}


/* =========================================
   STATES
========================================= */

async function loadStates(cert) {

    if (!cert) {
        return json({
            error:
                "Bank certificate is required."
        }, 400);
    }

    const result = await fdicRequest(
        "/locations",
        {
            search:
                `CERT:${escapeQuery(cert)}`,

            fields:
                "STALP",

            limit:
                1000,

            offset:
                0,

            format:
                "json"
        }
    );

    const set = new Set();

    for (const item of extractRows(result)) {

        const code =
            String(item.STALP ?? "")
                .trim()
                .toUpperCase();

        if (code) {
            set.add(code);
        }
    }

    const states =
        Array.from(set)
            .sort()
            .map(code => {

                const found =
                    STATES.find(
                        x => x[0] === code
                    );

                return {
                    code: code,
                    name:
                        found
                            ? found[1]
                            : code
                };
            });

    return json({
        cert: String(cert),
        count: states.length,
        states: states
    });
}


/* =========================================
   CITIES
========================================= */

async function loadCities(
    cert,
    state
) {

    if (!cert || !state) {
        return json({
            error:
                "Bank and state are required."
        }, 400);
    }

    const result = await fdicRequest(
        "/locations",
        {
            search:
                `CERT:${escapeQuery(cert)} AND STALP:${escapeQuery(state)}`,

            fields:
                "CITY",

            limit:
                1000,

            offset:
                0,

            format:
                "json"
        }
    );

    const set = new Set();

    for (const item of extractRows(result)) {

        const city =
            String(item.CITY ?? "")
                .trim();

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

    return json({
        cert: String(cert),
        state: String(state),
        count: cities.length,
        cities: cities
    });
}


/* =========================================
   BRANCHES
========================================= */

async function loadBranches(
    cert,
    state,
    city
) {

    if (!cert || !state || !city) {
        return json({
            error:
                "Bank, state and city are required."
        }, 400);
    }

    const result = await fdicRequest(
        "/locations",
        {
            search:
                `CERT:${escapeQuery(cert)} AND STALP:${escapeQuery(state)} AND CITY:${escapeQuery(city)}`,

            fields:
                "ID,NAME,OFFNAME,ADDRESS,CITY,STALP,ZIP,COUNTY,CERT,SERVTYPE",

            limit:
                1000,

            offset:
                0,

            format:
                "json"
        }
    );

    const branches = [];

    for (const item of extractRows(result)) {

        const id =
            String(item.ID ?? "").trim();

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
                ).trim(),

            county:
                String(
                    item.COUNTY || ""
                ).trim(),

            cert:
                String(
                    item.CERT || cert
                ).trim(),

            serviceType:
                String(
                    item.SERVTYPE || ""
                ).trim()
        });
    }

    branches.sort(
        (a, b) =>
            a.name.localeCompare(b.name)
    );

    return json({
        cert: String(cert),
        state: String(state),
        city: String(city),
        count: branches.length,
        branches: branches
    });
}


/* =========================================
   BRANCH DETAILS
========================================= */

async function loadBranch(id) {

    if (!id) {
        return json({
            error:
                "Branch ID is required."
        }, 400);
    }

    const result = await fdicRequest(
        "/locations",
        {
            search:
                `ID:${escapeQuery(id)}`,

            fields:
                "ID,NAME,OFFNAME,ADDRESS,CITY,STALP,ZIP,COUNTY,CERT,SERVTYPE",

            limit:
                1,

            offset:
                0,

            format:
                "json"
        }
    );

    const rows =
        extractRows(result);

    if (rows.length === 0) {

        return json({
            error:
                "Branch not found."
        }, 404);
    }

    const item = rows[0];

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

    Object.entries(params).forEach(
        ([key, value]) => {

            apiUrl.searchParams.set(
                key,
                String(value)
            );
        }
    );

    console.log(
        "FDIC REQUEST:",
        apiUrl.toString()
    );

    const response =
        await fetch(
            apiUrl.toString(),
            {
                method: "GET",
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
            "FDIC HTTP:",
            response.status,
            text
        );

        throw new Error(
            `FDIC API HTTP ${response.status}`
        );
    }

    let data;

    try {

        data =
            JSON.parse(text);

    } catch {

        console.error(
            "FDIC returned:",
            text.substring(0, 1000)
        );

        throw new Error(
            "FDIC returned invalid JSON."
        );
    }

    console.log(
        "FDIC RESPONSE:",
        JSON.stringify(
            data
        ).substring(0, 2000)
    );

    return data;
}


/* =========================================
   EXTRACT FDIC RECORDS
========================================= */

function extractRows(result) {

    /*
     * FDIC responses can be wrapped differently
     * depending on the endpoint.
     */

    if (
        result &&
        Array.isArray(result.data)
    ) {
        return result.data;
    }

    if (
        result &&
        result.data &&
        Array.isArray(result.data.data)
    ) {
        return result.data.data;
    }

    if (
        result &&
        Array.isArray(result.data?.records)
    ) {
        return result.data.records;
    }

    if (
        result &&
        Array.isArray(result.records)
    ) {
        return result.records;
    }

    return [];
}


/* =========================================
   ESCAPE QUERY
========================================= */

function escapeQuery(value) {

    return String(value || "")
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
   JSON
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
                    "public, max-age=3600",

                "Access-Control-Allow-Origin":
                    "*"
            }
        }
    );
}
