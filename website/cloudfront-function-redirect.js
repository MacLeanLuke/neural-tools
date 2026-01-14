// CloudFront Function to redirect apex domain to www subdomain
// This function runs on viewer requests and redirects
// https://neural-tools.com/* to https://www.neural-tools.com/*

function handler(event) {
    var request = event.request;
    var host = request.headers.host.value;

    // Check if request is to apex domain (without www)
    if (host === 'neural-tools.com') {
        // Construct the redirect URL
        var redirectUrl = 'https://www.neural-tools.com' + request.uri;

        // Add query string if present
        if (request.querystring && Object.keys(request.querystring).length > 0) {
            var queryParams = [];
            for (var param in request.querystring) {
                var values = request.querystring[param];
                if (values.multiValue) {
                    values.multiValue.forEach(function(item) {
                        queryParams.push(param + '=' + item.value);
                    });
                } else {
                    queryParams.push(param + '=' + values.value);
                }
            }
            redirectUrl += '?' + queryParams.join('&');
        }

        // Return 301 redirect response
        var response = {
            statusCode: 301,
            statusDescription: 'Moved Permanently',
            headers: {
                'location': { value: redirectUrl },
                'cache-control': { value: 'max-age=3600' }
            }
        };

        return response;
    }

    // If already on www subdomain or other subdomain, continue with request
    return request;
}
