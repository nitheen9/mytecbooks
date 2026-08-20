const CITY_DATA_URL =
    "https://raw.githubusercontent.com/mattonweb/us-cities-by-state/main/data/us-cities.csv";

let cachedCities = null;

export async function getUSCities() {

    if (cachedCities) {
        return cachedCities;
    }

    const response =
        await fetch(
            CITY_DATA_URL,
            {
                headers: {
                    "Accept": "text/csv"
                }
            }
        );

    if (!response.ok) {

        throw new Error(
            "Unable to download US city data. HTTP " +
            response.status
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
                line =>
                    line.trim() !== ""
            );


    if (lines.length < 2) {

        throw new Error(
            "US city CSV is empty."
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
            "US city CSV format has changed."
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
            ).trim().toUpperCase();


        const city =
            String(
                row[nameIndex] || ""
            ).trim();


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

    let insideQuotes = false;


    for (
        let i = 0;
        i < line.length;
        i++
    ) {

        const char =
            line[i];


        if (
            char === '"'
        ) {

            if (
                insideQuotes &&
                line[i + 1] === '"'
            ) {

                current += '"';

                i++;

            }
            else {

                insideQuotes =
                    !insideQuotes;

            }

        }
        else if (
            char === "," &&
            !insideQuotes
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
