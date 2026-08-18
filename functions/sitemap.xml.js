const API = "https://api.postalpincode.in/pincode/";
const BASE_URL = "https://mytecbooks.pages.dev";

const PER_PAGE = 800;

// Cache valid pincodes in memory
let cachedPincodes = null;
let cacheTime = 0;

// Keep cache for 24 hours
const CACHE_TIME = 24 * 60 * 60 * 1000;


// Find valid Indian Pincodes from API
async function getValidPincodes() {

    // Use existing cache
    if (
        cachedPincodes &&
        Date.now() - cacheTime < CACHE_TIME
    ) {
        return cachedPincodes;
    }

    const valid = [];

    /*
     * Indian PIN codes are 6 digits.
     *
     * We check every possible PIN.
     */
    for (let pin = 100000; pin <= 999999; pin++) {

        try {

            const response = await fetch(
                `${API}${pin}`,
                {
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (!response.ok) {
                continue;
            }

            const data = await response.json();

            if (
                data &&
                data.Status === "Success" &&
                Array.isArray(data.PostOffice) &&
                data.PostOffice.length > 0
            ) {
                valid.push(String(pin));
            }

        } catch (error) {
            // Ignore failed API requests
        }
    }

    cachedPincodes = valid;
    cacheTime = Date.now();

    return valid;
}


export async function onRequestGet(context) {

    const requestUrl = new URL(context.request.url);

    const pageParam = requestUrl.searchParams.get("page");

    /*
     * Get valid Pincodes
     */
    const pincodes = await getValidPincodes();

    const totalPages = Math.ceil(
        pincodes.length / PER_PAGE
    );


    /*
     * MAIN SITEMAP
     *
     * /sitemap.xml
     */
    if (!pageParam) {

        let xml =
            `<?xml version="1.0" encoding="UTF-8"?>\n`;

        xml +=
            `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            xml += `  <sitemap>\n`;

            xml +=
                `    <loc>${BASE_URL}/sitemap.xml?page=${page}</loc>\n`;

            xml += `  </sitemap>\n`;
        }

        xml += `</sitemapindex>`;

        return new Response(xml, {
            headers: {
                "Content-Type":
                    "application/xml; charset=UTF-8",

                "Cache-Control":
                    "public, max-age=86400"
            }
        });
    }


    /*
     * INDIVIDUAL SITEMAP PAGE
     *
     * /sitemap.xml?page=1
     */
    const page = parseInt(pageParam, 10);

    if (
        !Number.isInteger(page) ||
        page < 1 ||
        page > totalPages
    ) {

        return new Response(
            "Sitemap page not found",
            {
                status: 404
            }
        );
    }


    /*
     * Get maximum 800 Pincodes
     */
    const start =
        (page - 1) * PER_PAGE;

    const pagePincodes =
        pincodes.slice(
            start,
            start + PER_PAGE
        );


    /*
     * Create XML
     */
    let xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n`;

    xml +=
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;


    /*
     * Homepage
     *
     * Put homepage on page 1
     */
    if (page === 1) {

        xml += `  <url>\n`;

        xml +=
            `    <loc>${BASE_URL}/</loc>\n`;

        xml += `  </url>\n`;
    }


    /*
     * Pincode URLs
     */
    for (const pin of pagePincodes) {

        xml += `  <url>\n`;

        xml +=
            `    <loc>${BASE_URL}/pincode/${pin}/</loc>\n`;

        xml += `  </url>\n`;
    }


    xml += `</urlset>`;


    return new Response(xml, {
        headers: {
            "Content-Type":
                "application/xml; charset=UTF-8",

            "Cache-Control":
                "public, max-age=86400"
        }
    });
}
