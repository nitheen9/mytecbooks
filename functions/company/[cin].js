export async function onRequestGet(context) {

    const cin = context.params.cin || "NO-CIN";

    return new Response(
        "COMPANY FUNCTION IS WORKING: " + cin,
        {
            status: 200,
            headers: {
                "content-type": "text/plain;charset=UTF-8"
            }
        }
    );
}
