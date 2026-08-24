const BASE_URL = "https://mytecbooks.pages.dev";

export async function onRequestGet(context) {

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';

    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    /*
     * NORMAL WEBSITE PAGES
     */
    xml += sitemapEntry("/sitemap-pages.xml");


    /*
     * PINCODE SITEMAPS
     *
     * Current pincode data:
     * 25 sitemap pages
     */
    for (let page = 1; page <= 25; page++) {

        xml += sitemapEntry(
            "/sitemap-pincode-" + page + ".xml"
        );

    }


    /*
     * RAILWAY STATION SITEMAPS
     *
     * Current railway data:
     * 11 sitemap pages
     */
    for (let page = 1; page <= 11; page++) {

        xml += sitemapEntry(
            "/sitemap-railway-" + page + ".xml"
        );

    }


    /*
     * COMPANY CIN SITEMAPS
     *
     * Current company data:
     * 88 sitemap pages
     */
    for (let page = 1; page <= 88; page++) {

        xml += sitemapEntry(
            "/sitemap-company-" + page + ".xml"
        );

    }


    xml += "</sitemapindex>";


    return new Response(xml, {

        status: 200,

        headers: {
            "Content-Type": "application/xml; charset=UTF-8",
            "Cache-Control": "public, max-age=3600"
        }

    });
}


/*
 * Create sitemap index entry
 */
function sitemapEntry(path) {

    return (
        "  <sitemap>\n" +
        "    <loc>" +
        BASE_URL +
        path +
        "</loc>\n" +
        "  </sitemap>\n"
    );

}
