import railwayData from "./data/RailwayStationCode.json";

const BASE_URL = "https://mytecbooks.pages.dev";

const PER_PAGE = 800;

export async function onRequestGet(context) {

    const pageParam = context.params.page;

    const page = parseInt(pageParam, 10);


    if (
        !Number.isInteger(page) ||
        page < 1
    ) {

        return new Response(
            "Sitemap page not found",
            {
                status: 404
            }
        );

    }


    const railwayPages = [

        ...new Set(

            railwayData

                .map(function (item) {

                    return String(
                        item.station_code || ""
                    )
                        .trim()
                        .toUpperCase();

                })

                .filter(function (code) {

                    return /^[A-Z0-9]{2,6}$/.test(code);

                })

        )

    ];


    const totalPages =
        Math.ceil(
            railwayPages.length / PER_PAGE
        );


    if (page > totalPages) {

        return new Response(
            "Sitemap page not found",
            {
                status: 404
            }
        );

    }


    const start =
        (page - 1) * PER_PAGE;


    const pageRailway =
        railwayPages.slice(
            start,
            start + PER_PAGE
        );


    let xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml +=
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';


    for (const code of pageRailway) {

        xml += "  <url>\n";

        xml +=
            "    <loc>" +
            BASE_URL +
            "/railway/" +
            encodeURIComponent(code) +
            "/</loc>\n";

        xml += "  </url>\n";

    }


    xml += "</urlset>";


    return new Response(xml, {

        status: 200,

        headers: {
            "Content-Type": "application/xml; charset=UTF-8",
            "Cache-Control": "public, max-age=3600"
        }

    });

}
