import { Parser } from 'n3';

document.addEventListener('DOMContentLoaded', () => {
    const actionLabels = document.querySelectorAll('.action-label');

    actionLabels.forEach(actionLabel => {
        actionLabel.addEventListener('click', () => {
            const actionPanelHeader = document.getElementById('action-panel-header');
            actionPanelHeader.textContent = `Action: ${actionLabel.textContent}`;

            const expandableContent = document.getElementById('expandable-content');
            const bottomRow = document.getElementById('bottom-row');

            expandableContent.classList.add('expanded');
            bottomRow.classList.add('expanded');

            const expandToggle = document.getElementById('expand-toggle');
            expandToggle.textContent = expandableContent.classList.contains('expanded') ? 'Collapse' : 'Expand';
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

document.getElementById("webid-form").addEventListener("submit", async e => {
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
        var parser = new Parser();
        parser.parse(responseText,
            (err, quad, prefixes) => {
                if (quad) {
                    console.log(`quad.object.value: ${quad.object.value}`);
                    console.log(`quad.predicate.value: ${quad.predicate.value}`);
                    console.log(`quad.subject.value: ${quad.subject.value}`);
                    console.log("-----------------------------------------");

                    if (quad.predicate.id == "http://www.w3.org/ns/solid/terms#oidcIssuer") {
                        localStorage.setItem("solid_oidc_issuer", quad.object.value)
                        document.getElementById("solid_oidc_issuer").innerText = quad.object.value;
                        document.getElementById("solid_oidc_issuer_div").classList = "";
                    }
                } else if (err) {
                    console.error(`item not parseable as an n3 quad`, err);
                } else {
                    console.log("Prefixes", prefixes);
                }
            })
    })
    .catch(e => {
        console.error(e);

        document.getElementById("error_details").innerText = e.error+"\n\n"+e.error_description;
        document.getElementById("error").classList = "";
    });
});