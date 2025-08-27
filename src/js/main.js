import { Parser } from 'n3';

document.addEventListener('DOMContentLoaded', () => {
    const actionLabels = document.querySelectorAll('.action-label');
    const actionPanels = document.querySelectorAll('.action-panel');

    actionLabels.forEach(actionLabel => {
        actionLabel.addEventListener('click', () => {
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
});

document.addEventListener('DOMContentLoaded', function() {
    const expandableContent = document.getElementById('expandable-content');
    const expandToggle = document.getElementById('expand-toggle');
    const bottomRow = document.getElementById('bottom-row');
    
    expandToggle.addEventListener('click', function() {
        expandableContent.classList.toggle('expanded');
        bottomRow.classList.toggle('expanded');
        expandToggle.textContent = expandableContent.classList.contains('expanded') ? 'Collapse' : 'Expand';
    });
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

    var openidConfiguration = `${solidOidcIssuerBaseUrl}/.well-known/openid-configuration`;
    
    await fetch(openidConfiguration)
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
    .then(oidConfig => {
        console.log(JSON.stringify(oidConfig));

        localStorage.setItem("authorization_endpoint", oidConfig.authorization_endpoint);
        localStorage.setItem("token_endpoint", oidConfig.token_endpoint);
        localStorage.setItem("registration_endpoint", oidConfig.registration_endpoint);

        const responseValuesDisplayDiv = document.getElementById('key-value-pairs');
        responseValuesDisplayDiv.innerHTML = ''; // Clear existing values

        var keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        var valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        keyDiv.textContent = "authorization_endpoint";
        valueDiv.textContent = oidConfig.authorization_endpoint;

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);

        keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        keyDiv.textContent = "token_endpoint";
        valueDiv.textContent = oidConfig.token_endpoint;

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);

        keyDiv = document.createElement('div');
        keyDiv.className = 'grid-value';
        valueDiv = document.createElement('div');
        valueDiv.className = 'grid-value';

        keyDiv.textContent = "registration_endpoint";
        valueDiv.textContent = oidConfig.registration_endpoint;

        responseValuesDisplayDiv.appendChild(keyDiv);
        responseValuesDisplayDiv.appendChild(valueDiv);
    })
    .catch(e => {
        console.error(e);

        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    });
});

// PKCE Code Verifier Form Handler
document.getElementById("pkce-form").addEventListener("submit", async e => {
    e.preventDefault();
    const length = document.getElementById("code-length").value;
    const responseDisplay = e.target.parentElement.querySelector('.response-display');

    try {
        const verifier = generateCodeVerifier(length);
        const challenge = await generateCodeChallenge(verifier);
        
        localStorage.setItem("code_verifier", verifier);
        responseDisplay.innerHTML = `
            <div>
                <h4>Code Verifier:</h4>
                <pre>${verifier}</pre>
                <h4>Code Challenge:</h4>
                <pre>${challenge}</pre>
            </div>`;
    } catch (error) {
        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

// Save Code Verifier Form Handler
document.getElementById("save-verifier-form").addEventListener("submit", e => {
    e.preventDefault();
    const verifier = document.getElementById("code-verifier").value;
    const responseDisplay = e.target.parentElement.querySelector('.response-display');

    try {
        localStorage.setItem("code_verifier", verifier);
        responseDisplay.innerHTML = `<div class="success">Code verifier saved successfully!</div>`;
    } catch (error) {
        responseDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
});

// Authorization Request Form Handler
document.getElementById("auth-request-form").addEventListener("submit", e => {
    e.preventDefault();
    const endpoint = document.getElementById("auth-endpoint").value;
    const responseDisplay = e.target.parentElement.querySelector('.response-display');

    try {
        const codeChallenge = localStorage.getItem("code_challenge");
        const authUrl = new URL(endpoint);
        authUrl.searchParams.append("response_type", "code");
        authUrl.searchParams.append("code_challenge_method", "S256");
        authUrl.searchParams.append("code_challenge", codeChallenge);
        
        responseDisplay.innerHTML = `
            <div>
                <h4>Authorization URL:</h4>
                <pre>${authUrl.toString()}</pre>
            </div>`;
        
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