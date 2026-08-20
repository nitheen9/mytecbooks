const CITY_DATA_URL =
    "https://raw.githubusercontent.com/mattonweb/us-cities-by-state/main/data/us-cities.csv";

let cachedCities = null;

export async function getUSCities() {

    if (cachedCities) {
        return cachedCities;
    }

    const response =
        await fetch(
            CITY_DATA_URL
        );

    if (!response.ok) {

        throw new Error(
            "Unable to load U.S. city data."
        );
    }

    const text =
        await response.text();

    cachedCities =
        parseCSV(text);

    return cachedCities;
}


function parseCSV(text) {

    const lines =
        text
            .replace(/^\uFEFF/, "")
            .split(/\r?\n/)
            .filter(
                x =>
                    x.trim() !== ""
            );


    if (lines.length < 2) {

        throw new Error(
            "City dataset is empty."
        );
    }


    const headers =
        parseCSVLine(
            lines[0]
        );


    const stateIndex =
        headers.indexOf(
            "state_code"
        );

    const nameIndex =
        headers.indexOf(
            "name"
        );


    if (
        stateIndex === -1 ||
        nameIndex === -1
    ) {

        throw new Error(
            "City dataset format is invalid."
        );
    }


    const result = [];


    for (
        let i = 1;
        i < lines.length;
        i++
    ) {

        const row =
            parseCSVLine(
                lines[i]
            );


        if (
            row.length <=
            Math.max(
                stateIndex,
                nameIndex
            )
        ) {

            continue;
        }


        const state =
            String(
                row[stateIndex] || ""
            )
                .trim()
                .toUpperCase();


        const city =
            String(
                row[nameIndex] || ""
            )
                .trim();


        if (
            state &&
            city
        ) {

            result.push({

                state:
                    state,

                city:
                    city
            });
        }
    }


    return result;
}


function parseCSVLine(line) {

    const result = [];

    let current = "";

    let quoted = false;


    for (
        let i = 0;
        i < line.length;
        i++
    ) {

        const char =
            line[i];


        if (char === '"') {

            if (
                quoted &&
                line[i + 1] === '"'
            ) {

                current += '"';

                i++;

            }
            else {

                quoted =
                    !quoted;
            }

        }
        else if (
            char === "," &&
            !quoted
        ) {

            result.push(
                current
            );

            current = "";

        }
        else {

            current += char;
        }
    }


    result.push(
        current
    );


    return result;
}
