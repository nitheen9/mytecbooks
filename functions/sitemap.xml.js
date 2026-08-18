export async function onRequestGet(context) {

    const BASE_URL = "https://mytecbooks.pages.dev";
    const PER_PAGE = 800;

    /*
     * Add your normal/future pages here.
     * Pincode URLs can also be added automatically.
     */

    const pages = [
        "/",
        "/about/",
        "/contact/",
        "/privacy-policy/",
        "/disclaimer/"
    ];

    /*
     * Pincode list
     *
     * This can later be automatically generated.
     * Only valid Pincode numbers should be placed here.
     */

    const pincodes = [
        // Example:
        // "521161",
        // "521162",
        // "521163",
        // "521164"
    ];

    /*
     * Future Bank / IFSC URLs
     *
     * Add automatically later.
     */

    const bankPages = [
        // "/bank/ifsc/SBIN0001234/",
        // "/bank/ifsc/HDFC0001234/"
    ];

    /*
     * Combine everything
     */

    const urls = [];

    // Normal pages
    for (const path of pages) {
        urls.push(path);
    }

    // Pincode pages
    for (const pin of pincodes) {

        if (/^\d{6}$/.test(pin)) {
            urls.push(`/pincode/${pin}/`);
        }

    }

    // Bank pages
    for (const path of bankPages) {
        urls.push(path);
    }

    /*
     * Remove duplicate URLs
     */

    const uniqueUrls = [...new Set(urls)];

    /*
     * Which sitemap page?
     */

    const requestUrl = new URL(context.request.url);
    const pageParameter = requestUrl.searchParams.get("page");

    /*
     * MAIN SITEMAP
     *
     * /sitemap.xml
     *
     * Shows sitemap pages.
     */

    if (!pageParameter) {

        const totalPages = Math.max(
            1,
            Math.ceil(uniqueUrls.length / PER_PAGE)
        );

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
                "Content-Type": "application/xml; charset=UTF-8",
                "Cache-Control": "public, max-age=3600"
            }

        });

    }

    /*
     * SPECIFIC SITEMAP PAGE
     *
     * /sitemap.xml?page=1
     */

    const page = parseInt(pageParameter, 10);

    if (
        !Number.isInteger(page) ||
        page < 1
    ) {

        return new Response(
            "Invalid sitemap page",
            {
                status: 404
            }
        );

    }

    const start = (page - 1) * PER_PAGE;

    const pageUrls = uniqueUrls.slice(
        start,
        start + PER_PAGE
    );

    /*
     * Page doesn't exist
     */

    if (pageUrls.length === 0) {

        return new Response(
            "Sitemap page not found",
            {
                status: 404
            }
        );

    }

    /*
     * Generate XML
     */

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;

    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const path of pageUrls) {

        xml += `  <url>\n`;
        xml += `    <loc>${BASE_URL}${path}</loc>\n`;
        xml += `  </url>\n`;

    }

    xml += `</urlset>`;

    return new Response(xml, {

        headers: {
            "Content-Type": "application/xml; charset=UTF-8",
            "Cache-Control": "public, max-age=3600"
        }

    });

}
