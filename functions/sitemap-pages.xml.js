const BASE_URL = "https://mytecbooks.pages.dev";

export async function onRequestGet(context) {

    const pages = [

        "/",

        "/about/",
        "/contact/",
        "/privacy-policy/",
        "/disclaimer/"

    ];


    let xml =
        '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml +=
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';


    for (const path of pages) {

        xml += "  <url>\n";

        xml +=
            "    <loc>" +
            BASE_URL +
            path +
            "</loc>\n";

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
