import companyCINs from "./data/AP_AR_AS_AandM_Company_CIN.json";

const BASE_URL = "https://mytecbooks.pages.dev";

const PER_PAGE = 5000;

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


    const companyPages = [

        ...new Set(

            companyCINs

                .map(String)

                .map(function (cin) {

                    return cin
                        .trim()
                        .toUpperCase();

                })

                .filter(function (cin) {

                    return cin.length > 0;

                })

        )

    ];


    const totalPages =
        Math.ceil(
            companyPages.length / PER_PAGE
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


    const pageCompanies =
        companyPages.slice(
            start,
            start + PER_PAGE
        );


    let xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml +=
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';


    for (const cin of pageCompanies) {

        xml += "  <url>\n";

        xml +=
            "    <loc>" +
            BASE_URL +
            "/company/" +
            encodeURIComponent(cin) +
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
