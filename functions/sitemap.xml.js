const BASE_URL = "https://mytecbooks.pages.dev";
const PER_PAGE = 800;

// Valid Pincode list will be loaded here
// Example format:
// const pincodes = ["521161", "521162", "521163"];

const pincodes = [];

// Other pages
const pages = [
    "/"
];

// Future bank/IFSC URLs can be added here
const bankPages = [];


export async function onRequestGet(context) {

    const requestUrl = new URL(context.request.url);
    const pageParam = requestUrl.searchParams.get("page");


    // Combine all URLs
    const urls = [
        ...pages,

        ...pincodes
            .filter(pin => /^\d{6}$/.test(pin))
            .map(pin => `/pincode/${pin}/`),

        ...bankPages
    ];


    // Remove duplicates
    const uniqueUrls = [...new Set(urls)];


    // MAIN SITEMAP
    // /sitemap.xml

    if (!pageParam) {

        const totalPages = Math.max(
            1,
            Math.ceil(uniqueUrls.length / PER_PAGE)
        );

        let xml =
            `<?xml version="1.0" encoding="UTF-8"?>\n`;

        xml +=
            `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        for (let page = 1; page <= totalPages; page++) {

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


    // INDIVIDUAL PAGE

    const page = parseInt(pageParam, 10);

    if (!Number.isInteger(page) || page < 1) {

        return new Response(
            "Invalid sitemap page",
            { status: 404 }
        );
    }


    const start =
        (page - 1) * PER_PAGE;

    const pageUrls =
        uniqueUrls.slice(
            start,
            start + PER_PAGE
        );


    if (pageUrls.length === 0) {

        return new Response(
            "Sitemap page not found",
            { status: 404 }
        );
    }


    // XML

    let xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n`;

    xml +=
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;


    for (const path of pageUrls) {

        xml += `  <url>\n`;

        xml +=
            `    <loc>${BASE_URL}${path}</loc>\n`;

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
