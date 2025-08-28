import { Parser } from 'n3';

const client_config = {
	client_id: "https://our-home.net/myappid#this",
	client_name: "https://our-home.net/myappid#this",
	application_type:"web",
	redirect_uris: [
		"http://localhost:5173/"
	],
	subject_type:"public",
	token_endpoint_auth_method:"client_secret_basic",
	id_token_signed_response_alg:"RS256",
	grant_types:[
		"authorization_code",
		"refresh_token"
	]
}
// Configure your application and authorization server details
const config = {
    redirect_uri: "http://localhost:5173/",
    requested_scopes: "openid offline_access"
};

document.addEventListener('DOMContentLoaded', () => {
    const actionLabels = document.querySelectorAll('.action-label');
    const actionPanels = document.querySelectorAll('.action-panel');

    actionLabels.forEach(actionLabel => {
        actionLabel.addEventListener('click', () => {
            console.log(`Clicked on action label: ${actionLabel.id}`); 
            // Hide all panels first
            actionPanels.forEach(panel => {
                panel.style.display = 'none';
            });

            // Show the selected panel
            const activeActionPanel = document.getElementById(`action-panel-${actionLabel.id}`);
            if (activeActionPanel) {
                activeActionPanel.style.display = 'block';
            }

            // Expand the content area
            const expandableContent = document.getElementById('expandable-content');
            const bottomRow = document.getElementById('bottom-row');
            
            expandableContent.classList.add('expanded');
            bottomRow.classList.add('expanded');

            const expandToggle = document.getElementById('expand-toggle');
            expandToggle.textContent = 'Collapse';
        });
    });

    const expandableContent = document.getElementById('expandable-content');
    const expandToggle = document.getElementById('expand-toggle');
    const bottomRow = document.getElementById('bottom-row');
    
    expandToggle.addEventListener('click', function() {
        expandableContent.classList.toggle('expanded');
        bottomRow.classList.toggle('expanded');
        expandToggle.textContent = expandableContent.classList.contains('expanded') ? 'Collapse' : 'Expand';
    });

    // Handle OAuth redirect
    (async () => {
        var queryStringElements = parseQueryString(window.location.search.substring(1));
        const responseDisplay = document.getElementById("action-panel-authorization").querySelector('.response-display');

        if(queryStringElements.error) {
            responseDisplay.innerHTML = `<div class="error">Error: ${queryStringElements.error} - ${queryStringElements.error_description}</div>`;
        }

        if(queryStringElements.code) {
            if(localStorage.getItem("pkce_state") != queryStringElements.state) {
                responseDisplay.innerHTML = 'Invalid state';
            } else {
                console.log("simulating click on Authorization panel");
                document.getElementById("authorization").click();

                localStorage.setItem("authorization_code", queryStringElements.code);
                window.history.replaceState({}, null, "/");

                const responseValuesDisplayDiv = document.getElementById('authorization-key-value-pairs');
                responseValuesDisplayDiv.innerHTML = '';

                var keyDiv = document.createElement('div');
                keyDiv.className = 'grid-value';
                var valueDiv = document.createElement('div');
                valueDiv.className = 'grid-value';

                keyDiv.textContent = "authorization_code";
                valueDiv.textContent = queryStringElements.code;

                responseValuesDisplayDiv.appendChild(keyDiv);
                responseValuesDisplayDiv.appendChild(valueDiv);
            }
        }
    })();
});

document.getElementById("retrieve-profile-form").addEventListener("submit", async e => {
    e.preventDefault();
    
    const webIdInput = document.getElementById("webid-input");
    const webId = webIdInput.value;

    await fetch(webId)
    .then(async response => {
        if (!response.ok) {
            if(response.status < 500)
            {
                const errorResponse = await response.json();
                throw errorResponse;
            }
        } 
        return await response.text()
    })
    .then(responseText => {
        console.log(responseText);
        const quadValuesDiv = document.getElementById('quad-values');
        quadValuesDiv.innerHTML = ''; // Clear existing values
        
        var parser = new Parser();
        parser.parse(responseText,
            (err, quad, prefixes) => {
                if (quad) {
                    // Create new row for quad values
                    const subjectDiv = document.createElement('div');
                    const predicateDiv = document.createElement('div');
                    const objectDiv = document.createElement('div');
                    
                    subjectDiv.className = 'grid-value';
                    predicateDiv.className = 'grid-value';
                    objectDiv.className = 'grid-value';
                    
                    subjectDiv.textContent = quad.subject.value;
                    predicateDiv.textContent = quad.predicate.value;
                    objectDiv.textContent = quad.object.value;
                    
                    quadValuesDiv.appendChild(subjectDiv);
                    quadValuesDiv.appendChild(predicateDiv);
                    quadValuesDiv.appendChild(objectDiv);

                    if (quad.predicate.id == "http://www.w3.org/ns/solid/terms#oidcIssuer") {
                        localStorage.setItem("solid_oidc_issuer_base_url", quad.object.value);
                        objectDiv.classList.add('highlight');
                        
                        const issuerInput = document.getElementById('solid_oidc_issuer_base_url');
                        issuerInput.value = localStorage.getItem('solid_oidc_issuer_base_url') || '';
                    }

                    if (quad.predicate.id == "http://xmlns.com/foaf/0.1/isPrimaryTopicOf") {
                        localStorage.setItem("profile_storage_url", quad.object.value);
                        objectDiv.classList.add('highlight');
                        
                        const issuerInput = document.getElementById('solid_oidc_issuer_base_url');
                        issuerInput.value = localStorage.getItem('solid_oidc_issuer_base_url') || '';
                    }
                } else if (err) {
                    console.error(`item not parseable as an n3 quad`, err);
                }
            })
    })
    .catch(e => {
        console.error(e);

        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    });
});

// OP Configuration Form Handler
document.getElementById("op-config-form").addEventListener("submit", async e => {
    e.preventDefault();

    const solidOidcIssuerBaseUrl = document.getElementById("solid_oidc_issuer_base_url").value;
    const responseDisplay = e.target.parentElement.querySelector('.response-display');

    var openIdConfigurationEndpoint = `${solidOidcIssuerBaseUrl}/.well-known/openid-configuration`;
    
    await fetch(openIdConfigurationEndpoint)
    .then(async response => {
        if (!response.ok) {
            if(response.status < 500)
            {
                const errorResponse = await response.json();
                throw errorResponse;
            }
        } 
        return await response.json()
    })
    .then(openIdConfiguration => {
        console.log(JSON.stringify(openIdConfiguration));

        localStorage.setItem("authorization_endpoint", openIdConfiguration.authorization_endpoint);
        localStorage.setItem("token_endpoint", openIdConfiguration.token_endpoint);
        localStorage.setItem("registration_endpoint", openIdConfiguration.registration_endpoint);

        const responseValuesDisplayDiv = document.getElementById('key-value-pairs');
        responseValuesDisplayDiv.innerHTML = ''; // Clear existing values

        var keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        var valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        keyDiv.textContent = "authorization_endpoint";
        valueDiv.textContent = openIdConfiguration.authorization_endpoint;

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);

        keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        keyDiv.textContent = "token_endpoint";
        valueDiv.textContent = openIdConfiguration.token_endpoint;

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);

        keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        keyDiv.textContent = "registration_endpoint";
        valueDiv.textContent = openIdConfiguration.registration_endpoint;

        const registrationEndpoint = document.getElementById('registration_endpoint');
        registrationEndpoint.value = openIdConfiguration.registration_endpoint;

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);

        const clientConfigInput = document.getElementById('solid_client_config');
        clientConfigInput.value = JSON.stringify(client_config);
    })
    .catch(e => {
        console.error(e);

        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    });
});

document.getElementById("client-registration-form").addEventListener("submit", async e => {
    e.preventDefault();
    
    const registrationEndpointInput = document.getElementById("registration_endpoint");
    const registrationEndpoint = registrationEndpointInput.value;
    
    const clientConfigInput = document.getElementById("solid_client_config");
    const clientConfig = JSON.parse(clientConfigInput.value);

    await fetch(registrationEndpoint, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(clientConfig)
        })
    .then(async response => {
        if (!response.ok) {
            if(response.status < 500)
            {
                const errorResponse = await response.json();
                throw errorResponse;
            }
        } 
        return await response.json();
    })
    .then(clientRegistrationResponse => {
        var start = new Date(0);
        start.setUTCSeconds(Math.floor(Date.now() / 1000));
        console.log(JSON.stringify(clientRegistrationResponse));

        const responseValuesDisplayDiv = document.getElementById('client-registration-key-value-pairs');
        responseValuesDisplayDiv.innerHTML = ''; // Clear existing values

        var keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        var valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        keyDiv.textContent = "client_id";
        valueDiv.textContent = clientRegistrationResponse.client_id;

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);

        keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        keyDiv.textContent = "client_name";
        valueDiv.textContent = clientRegistrationResponse.client_name;

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);

        keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        keyDiv.textContent = "client_secret";
        valueDiv.textContent = clientRegistrationResponse.client_secret;

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);

        keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        var expires_at_date_time = new Date(0); // The 0 there is the key, which sets the date to the epoch
        expires_at_date_time.setUTCSeconds(clientRegistrationResponse.client_secret_expires_at);

        keyDiv.textContent = "client_secret_expires_at";
        valueDiv.textContent = expires_at_date_time.toISOString();

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);

        localStorage.setItem("client_id", clientRegistrationResponse.client_id);
        localStorage.setItem("client_secret", clientRegistrationResponse.client_secret);

    })
    .catch(e => {
        console.error(e);

        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    });
});

// PKCE Code Verifier Form Handler
document.getElementById("pkce-form").addEventListener("submit", async e => {
    e.preventDefault();

    const responseDisplay = e.target.parentElement.querySelector('.response-display');

    try {
        // Create and store a random "state" value
        var state = generateRandomString();
        localStorage.setItem("pkce_state", state);

        // Step 4
        // Create and store a new PKCE code_verifier (the plaintext random secret)
        var code_verifier = generateRandomString();
        // Step 5
        localStorage.setItem("pkce_code_verifier", code_verifier);

        // Step 4
        // Hash and base64-urlencode the secret to use as the challenge
        var code_challenge = await pkceChallengeFromVerifier(code_verifier);
        // Step 5
        localStorage.setItem("pkce_code_challenge", code_challenge);

        // Build the authorization URL
        var url = localStorage.getItem("authorization_endpoint")
        + "?response_type=code"
        + "&client_id="+encodeURIComponent(localStorage.getItem("client_id"))
        + "&state="+encodeURIComponent(state)
        + "&scope="+encodeURIComponent(config.requested_scopes)
        + "&redirect_uri="+encodeURIComponent(config.redirect_uri)
        + "&code_challenge="+encodeURIComponent(code_challenge)
        + "&code_challenge_method=S256";

        localStorage.setItem("authorization_url", url);

        const authUrlInput = document.getElementById('auth-url');
        authUrlInput.value = localStorage.getItem('authorization_url') || '';
        
        responseDisplay.innerHTML = `
            <div>
                <h4>Code Verifier:</h4>
                <pre>${code_verifier}</pre>
                <h4>Code Challenge:</h4>
                <pre>${code_challenge}</pre>
            </div>`;
    } catch (error) {
        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

// Authorization Request Form Handler
document.getElementById("auth-request-form").addEventListener("submit", e => {
    e.preventDefault();
    const authUrl = document.getElementById("auth-url").value;
    const responseDisplay = e.target.parentElement.querySelector('.response-display');

    try {
        // const codeChallenge = localStorage.getItem("code_challenge");
        // const authUrl = new URL(endpoint);
        // authUrl.searchParams.append("response_type", "code");
        // authUrl.searchParams.append("code_challenge_method", "S256");
        // authUrl.searchParams.append("code_challenge", codeChallenge);
        
        // responseDisplay.innerHTML = `
        //     <div>
        //         <h4>Authorization URL:</h4>
        //         <pre>${authUrl.toString()}</pre>
        //     </div>`;
        
        window.location.href = authUrl.toString();
    } catch (error) {
        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

// DPoP Generation Form Handler
document.getElementById("dpop-gen-form").addEventListener("submit", async e => {
    e.preventDefault();
    const keyType = document.getElementById("key-type").value;
    const responseDisplay = e.target.parentElement.querySelector('.response-display');

    try {
        const keyPair = await generateKeyPair(keyType);
        localStorage.setItem("dpop_key_pair", JSON.stringify(keyPair));
        responseDisplay.innerHTML = `<div class="success">DPoP key pair generated successfully!</div>`;
    } catch (error) {
        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

// DPoP Header Form Handler
document.getElementById("dpop-header-form").addEventListener("submit", async e => {
    e.preventDefault();
    const method = document.getElementById("http-method").value;
    const uri = document.getElementById("target-uri").value;
    const responseDisplay = e.target.parentElement.querySelector('.response-display');

    try {
        const keyPair = JSON.parse(localStorage.getItem("dpop_key_pair"));
        const dpopHeader = await generateDPoPHeader(method, uri, keyPair);
        responseDisplay.innerHTML = `
            <div>
                <h4>DPoP Header:</h4>
                <pre>${dpopHeader}</pre>
            </div>`;
    } catch (error) {
        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

// Token Request Form Handler
document.getElementById("token-request-form").addEventListener("submit", async e => {
    e.preventDefault();
    const endpoint = document.getElementById("token-endpoint").value;
    const code = document.getElementById("auth-code").value;
    const responseDisplay = e.target.parentElement.querySelector('.response-display');

    try {
        const codeVerifier = localStorage.getItem("code_verifier");
        const dpopHeader = await generateDPoPHeader("POST", endpoint);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'DPoP': dpopHeader
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                code_verifier: codeVerifier
            })
        });

        const data = await response.json();
        responseDisplay.innerHTML = `
            <div>
                <h4>Token Response:</h4>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>`;
    } catch (error) {
        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

// Generate a secure random string using the browser crypto functions
function generateRandomString() {
    var array = new Uint32Array(28);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}

// Return the base64-urlencoded sha256 hash for the PKCE challenge
async function pkceChallengeFromVerifier(v) {
    const hashed = await sha256(v);
    // Convert the ArrayBuffer to string using Uint8 array to convert to what btoa accepts.
    let stringyfiedHash = String.fromCharCode.apply(null, new Uint8Array(hashed))
    return base64urlencode(stringyfiedHash);
}

// Calculate the SHA256 hash of the input text. 
// Returns a promise that resolves to an ArrayBuffer
async function sha256(plainText) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    return await window.crypto.subtle.digest('SHA-256', data);
}

// Base64-urlencodes the input string
function base64urlencode(string) {
    // btoa accepts chars only within ascii 0-255 and base64 encodes them.
    // Then convert the base64 encoded to base64url encoded
    //   (replace + with -, replace / with _, trim trailing =)
    return btoa(string)
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}


function parseQueryString(string) {
    if(string == "") { return {}; }
    var segments = string.split("&").map(s => s.split("=") );
    var queryString = {};
    segments.forEach(s => queryString[s[0]] = s[1]);
    return queryString;
}

async function generateDpopHeader(claims) {
    
    return await getGenerateJsonWebKeyAndThumbprint() 
    .then(async jwkAndThumbprint => {
        // return JWT.sign(jwk, { kid: kid }, claims)
        return await JWT.sign(jwkAndThumbprint.jwk, {}, claims)
    })
    .then(singedJwt => {
        console.info('JWT:', singedJwt);
        
        return singedJwt;
    })
}

async function getGenerateJsonWebKeyAndThumbprint() {
    const json_web_key_and_thumbprint = localStorage.getItem('json_web_key_and_thumbprint');
    if (json_web_key_and_thumbprint) {
        return JSON.parse(json_web_key_and_thumbprint);
    } else {
        return await EC.generate()
        .then(async jwk => {
            console.info('Private Key:', JSON.stringify(jwk));
            console.info('Public Key:', JSON.stringify(EC.neuter(jwk)));
    
            const thumbprint = await JWK.thumbprint(jwk);
            const jsonWebKeyAndThumbprint = { jwk, thumbprint }
            localStorage.setItem('json_web_key_and_thumbprint', JSON.stringify(jsonWebKeyAndThumbprint));
    
            return jsonWebKeyAndThumbprint
        })
    }
}

var JWT = {};
JWT.sign = async (jwk, headers, claims) => {
    // Make a shallow copy of the key
    // (to set ext if it wasn't already set)
    jwk = Object.assign({}, jwk);

    // The headers should probably be empty
    // headers.typ = 'JWT';
    headers.typ = 'dpop+jwt';
    headers.alg = 'ES256';
    if (!headers.kid) {
        // alternate: see thumbprint function below
        headers.jwk = { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y };
    }

    var jws = {
        // JWT "headers" really means JWS "protected headers"
        protected: strToUrlBase64(JSON.stringify(headers)),

        // JWT "claims" are really a JSON-defined JWS "payload"
        payload: strToUrlBase64(JSON.stringify(claims))
    };

    // To import as EC (ECDSA, P-256, SHA-256, ES256)
    var keyType = {
        name: 'ECDSA',
        namedCurve: 'P-256',
        hash: { name: 'SHA-256' }
    };

    // To make re-exportable as JSON (or DER/PEM)
    var exportable = true;

    // Import as a private key that isn't black-listed from signing
    var privileges = ['sign'];

    // Actually do the import, which comes out as an abstract key type
    return await window.crypto.subtle
        .importKey('jwk', jwk, keyType, exportable, privileges)
        .then(async privkey => {
            // Convert UTF-8 to Uint8Array ArrayBuffer
            var data = strToUint8(jws.protected + '.' + jws.payload);

            // The signature and hash should match the bit-entropy of the key
            // https://tools.ietf.org/html/rfc7518#section-3
            var sigType = { name: 'ECDSA', hash: { name: 'SHA-256' } };

            return await window.crypto.subtle.sign(sigType, privkey, data)
            .then(signature => {
                // returns an ArrayBuffer containing a JOSE (not X509) signature,
                // which must be converted to Uint8 to be useful
                jws.signature = uint8ToUrlBase64(new Uint8Array(signature));

                // JWT is just a "compressed", "protected" JWS
                return jws.protected + '.' + jws.payload + '.' + jws.signature;
            });
        });
};

var EC = {};
EC.generate = async () => {
    var keyType = {
        name: 'ECDSA',
        namedCurve: 'P-256'
    };
    var exportable = true;
    var privileges = ['sign', 'verify'];
    return await window.crypto.subtle.generateKey(keyType, exportable, privileges)
    .then(async key => {
        // returns an abstract and opaque WebCrypto object,
        // which in most cases you'll want to export as JSON to be able to save
        return await window.crypto.subtle.exportKey('jwk', key.privateKey);
    });
};

// Create a Public Key from a Private Key
//
// chops off the private parts
EC.neuter = jwk => {
    var copy = Object.assign({}, jwk);
    delete copy.d;
    copy.key_ops = ['verify'];
    return copy;
};

var JWK = {};
JWK.thumbprint = async jwk => {
    // lexigraphically sorted, no spaces
    var sortedPub = '{"crv":"CRV","kty":"EC","x":"X","y":"Y"}'
        .replace('CRV', jwk.crv)
        .replace('X', jwk.x)
        .replace('Y', jwk.y);

    // The hash should match the size of the key,
    // but we're only dealing with P-256
    return await window.crypto.subtle
        .digest({ name: 'SHA-256' }, strToUint8(sortedPub))
        .then(hash => {
            return uint8ToUrlBase64(new Uint8Array(hash));
        });
};

// UCS-2 String to URL-Safe Base64
//
// btoa doesn't work on UTF-8 strings
function strToUrlBase64(str) {
    return binToUrlBase64(utf8ToBinaryString(str));
}

// Binary String to URL-Safe Base64
//
// btoa (Binary-to-Ascii) means "binary string" to base64
function binToUrlBase64(bin) {
    return btoa(bin)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+/g, '');
}

// UTF-8 to Binary String
//
// Because JavaScript has a strange relationship with strings
// https://coolaj86.com/articles/base64-unicode-utf-8-javascript-and-you/
function utf8ToBinaryString(str) {
    var escstr = encodeURIComponent(str);
    // replaces any uri escape sequence, such as %0A,
    // with binary escape, such as 0x0A
    var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
    });

    return binstr;
}

// String (UCS-2) to Uint8Array
//
// because... JavaScript, Strings, and Buffers
function strToUint8(str) {
    return new TextEncoder().encode(str);
}

// Uint8Array to URL Safe Base64
//
// the shortest distant between two encodings... binary string
function uint8ToUrlBase64(uint8) {
    var bin = '';
    uint8.forEach(function(code) {
        bin += String.fromCharCode(code);
    });
    return binToUrlBase64(bin);
}

//////////////////////////////////////////////////////////////////////
// OAUTH REDIRECT HANDLING

// Handle the redirect back from the authorization server and
// get an access token from the token endpoint
    
/*
(async ()=>{
    var queryStringElements = parseQueryString(window.location.search.substring(1));
    const responseDisplay = document.getElementById("action-panel-authorization").querySelector('.response-display');

    // Check if the server returned an error string
    if(queryStringElements.error) {
        // Display the error message in the Authorization Panel
        responseDisplay.innerHTML = `<div class="error">Error: ${queryStringElements.error} - ${queryStringElements.error_description}</div>`;
    }

    // If the server returned an authorization code, attempt to exchange it for an access token      
    if(queryStringElements.code) {
        
        // Verify state matches what we set at the beginning
        if(localStorage.getItem("pkce_state") != queryStringElements.state) {
            responseDisplay.innerHTML = 'Invalid state';
        } else {

            console.log("simulating click on Authorization panel");
            document.getElementById("authorization").click();

            localStorage.setItem("authorization_code", queryStringElements.code);
            // Replace the history entry to remove the auth code from the browser address bar
            window.history.replaceState({}, null, "/");

            const responseValuesDisplayDiv = document.getElementById('authorization-key-value-pairs');
            responseValuesDisplayDiv.innerHTML = ''; // Clear existing values

            var keyDiv = document.createElement('div');
            keyDiv.className = 'grid-value';
            var valueDiv = document.createElement('div');
            valueDiv.className = 'grid-value';

            keyDiv.textContent = "authorization_code";
            valueDiv.textContent = queryStringElements.code;

            responseValuesDisplayDiv.appendChild(keyDiv);
            responseValuesDisplayDiv.appendChild(valueDiv);
            // tokenBody
            const claims = {
                "htu": localStorage.getItem("token_endpoint"),
                "htm": "POST",
                "jti": generateRandomString(),
                "iat": Math.round(Date.now() / 1000)
            }
        
            const requestParams = {
                grant_type: "authorization_code",
                code: queryStringElements.code,
                client_id: localStorage.getItem("client_id"),
                redirect_uri: config.redirect_uri,
                code_verifier: localStorage.getItem("pkce_code_verifier")
            }
            // Step 12. Generates a DPoP Client Key Pair
            // https://solidproject.org/TR/oidc-primer#authorization-code-pkce-flow-step-12
        
            // Step 13. Generates a DPoP Header 
            // https://solidproject.org/TR/oidc-primer#authorization-code-pkce-flow-step-13
            await generateDpopHeader(claims)
            .then(async userDPoPHeader => {
                console.log(`userDPoPHeader: ${userDPoPHeader}`);
                localStorage.setItem('user_dpop_header', userDPoPHeader);

                return await fetch(localStorage.getItem("token_endpoint"), {
                    method: 'POST',
                    headers: {
                        'DPoP': userDPoPHeader,
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'Authorization': 'Basic ' + btoa(localStorage.getItem("client_id") + ":" + localStorage.getItem("client_secret"))
                    },
                    body: Object.keys(requestParams).map(key => key + '=' + requestParams[key]).join('&')
                })
            })
            .then(async response => {
                if (!response.ok) {
                    if(response.status < 500)
                    {
                        const errorResponse = await response.json();
                        throw errorResponse;
                    }
                } 
                return await response.json()
            })
            .then(responseJson => {
                // Initialize your application now that you have an access token.
                // Here we just display it in the browser.
                localStorage.setItem("user_access_token", responseJson.access_token);

                document.getElementById("user_access_token").innerText = responseJson.access_token;
                document.getElementById("sign_in").classList = "hidden";
                document.getElementById("token").classList = "";
                
                document.getElementById("pkce_code_verifier").innerText = localStorage.getItem("pkce_code_verifier");
                document.getElementById("code_verifier").classList = "";
                
                document.getElementById("pkce_code_challenge").innerText = localStorage.getItem("pkce_code_challenge");
                document.getElementById("code_challenge").classList = "";
                
                // Replace the history entry to remove the auth code from the browser address bar
                window.history.replaceState({}, null, "/");
            })
            .catch(e => {
                console.error(e);

                document.getElementById("error_details").innerText = e.error+"\n\n"+e.error_description;
                document.getElementById("error").classList = "";

            });
        }
    }

})();
*/

/*=================================================*/
/* Co-pilot Generated Code Below This Line */
/*=================================================*/

// Utility Functions
function generateCodeVerifier(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let verifier = '';
    for (let i = 0; i < length; i++) {
        verifier += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return verifier;
}

async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function generateKeyPair(type) {
    if (type === 'RSA') {
        return await crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256"
            },
            true,
            ["sign", "verify"]
        );
    } else {
        return await crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            true,
            ["sign", "verify"]
        );
    }
}

async function generateDPoPHeader(method, uri, keyPair) {
    const header = {
        typ: "dpop+jwt",
        alg: keyPair.algorithm.name === "RSASSA-PKCS1-v1_5" ? "RS256" : "ES256",
        jwk: await crypto.subtle.exportKey("jwk", keyPair.publicKey)
    };

    const payload = {
        htm: method,
        htu: uri,
        jti: crypto.randomUUID(),
        iat: Math.floor(Date.now() / 1000)
    };

    // Note: This is a simplified version. In practice, you'd need a proper JWT encoding function
    return btoa(JSON.stringify(header)) + "." + 
           btoa(JSON.stringify(payload)) + "." +
           "signature"; // Placeholder for actual signature
}