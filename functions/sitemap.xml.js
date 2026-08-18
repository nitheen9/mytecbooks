export async function onRequestGet(context) {

    const BASE_URL = "https://mytecbooks.pages.dev";
    const PER_PAGE = 800;

    /*
     * Total possible 6-digit Pincode URLs
     * 100000 to 999999
     */
    const PIN_START = 100000;
    const PIN_END = 999999;

    const url = new URL(context.request.url);
    const pageParam = url.searchParams.get("page");

    /*
     * MAIN SITEMAP
     *
     * https://mytecbooks.pages.dev/sitemap.xml
     */

    if (!pageParam) {

        const totalPincodes = PIN_END - PIN_START + 1;
        const totalPages = Math.ceil(totalPincodes / PER_PAGE);

        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;

        xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        for (let page = 1; page <= totalPages; page++) {

            xml += `  <sitemap>\n`;
            xml += `    <loc>${BASE_URL}/sitemap.xml?page=${page}</loc>\n`;
            xml += `  </sitemap>\n`;

        }

        xml += `</sitemapindex>`;

        return new Response(xml, {
            headers: {
                "Content-Type": "application/xml; charset=UTF-8"
            }
        });
    }

    /*
     * SITEMAP PAGE
     *
     * ?page=1
     * ?page=2
     * ?page=3
     */

    const page = parseInt(pageParam, 10);

    if (!Number.isInteger(page) || page < 1) {

        return new Response("Invalid sitemap page", {
            status: 404
        });

    }

    const totalPincodes = PIN_END - PIN_START + 1;
    const totalPages = Math.ceil(totalPincodes / PER_PAGE);

    if (page > totalPages) {

        return new Response("Sitemap page not found", {
            status: 404
        });

    }

    const start = PIN_START + ((page - 1) * PER_PAGE);

    const end = Math.min(
        start + PER_PAGE - 1,
        PIN_END
    );

    /*
     * Generate sitemap
     */

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;

    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    /*
     * Homepage on first sitemap page
     */

    if (page === 1) {

        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/</loc>\n`;
        xml += `  </url>\n`;

    }

    /*
     * Generate Pincode URLs
     */

    for (let pin = start; pin <= end; pin++) {

        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}/pincode/${pin}/</loc>\n`;
        xml += `  </url>\n`;

    }

    xml += `</urlset>`;

    return new Response(xml, {
        headers: {
            "Content-Type": "application/xml; charset=UTF-8",
            "Cache-Control": "public, max-age=86400"
        }
    });
}
